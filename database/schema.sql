-- ============================================================================
-- SCHEMA DATABASE — Portale Proposte & Candidature
-- PostgreSQL 14+ (compatibile Supabase)
-- ============================================================================

-- Estensioni utili
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- per gen_random_uuid()

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------
CREATE TYPE proposal_status AS ENUM ('draft', 'published', 'closed', 'archived');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled_auto');
CREATE TYPE notification_type AS ENUM (
  'application_received',   -- il creatore riceve una nuova candidatura
  'application_accepted',   -- il candidato è stato accettato
  'application_rejected',   -- il candidato è stato rifiutato
  'application_auto_cancelled' -- candidatura ritirata automaticamente per esclusività
);

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(150) NOT NULL,
  headline        VARCHAR(200),                 -- es. "Full-Stack Developer | Milano"
  avatar_url      TEXT,
  bio             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- PROPOSALS (idee/proposte pubblicate)
-- ----------------------------------------------------------------------------
CREATE TABLE proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               VARCHAR(200) NOT NULL,
  slug                VARCHAR(220) NOT NULL UNIQUE,
  summary             VARCHAR(300),              -- estratto per le card in bacheca
  description         TEXT NOT NULL,
  category            VARCHAR(80),
  positions_available INTEGER NOT NULL DEFAULT 1 CHECK (positions_available >= 0),
  pdf_url             TEXT NOT NULL,              -- path/URL del documento allegato
  pdf_filename        VARCHAR(255) NOT NULL,
  status              proposal_status NOT NULL DEFAULT 'published',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_creator ON proposals(creator_id);
CREATE INDEX idx_proposals_status  ON proposals(status);
CREATE INDEX idx_proposals_created ON proposals(created_at DESC);

-- ----------------------------------------------------------------------------
-- APPLICATIONS (candidature)
-- Vincolo chiave: un utente può candidarsi una sola volta per proposta,
-- ma a più proposte diverse in contemporanea (multi-candidatura).
-- ----------------------------------------------------------------------------
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  applicant_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message         TEXT,                          -- lettera di presentazione opzionale
  status          application_status NOT NULL DEFAULT 'pending',
  decided_at      TIMESTAMPTZ,                    -- quando è stata accettata/rifiutata/cancellata
  decision_reason VARCHAR(255),                   -- es. "Ritirata: accettato su un'altra proposta"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_application_per_user_proposal UNIQUE (proposal_id, applicant_id)
);

CREATE INDEX idx_applications_proposal ON applications(proposal_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
-- Indice mirato: velocizza la ricerca "tutte le candidature pendenti di questo utente"
-- usata dalla regola di esclusività automatica.
CREATE INDEX idx_applications_applicant_pending
  ON applications(applicant_id)
  WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                  notification_type NOT NULL,
  title                 VARCHAR(150) NOT NULL,
  body                  TEXT NOT NULL,
  related_proposal_id   UUID REFERENCES proposals(id) ON DELETE SET NULL,
  related_application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  read_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- ----------------------------------------------------------------------------
-- Trigger generico per updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- NOTE DI DESIGN
-- ============================================================================
-- 1. Le candidature "cancellate automaticamente" NON vengono eliminate a livello
--    fisico (DELETE), ma marcate con status = 'cancelled_auto'. Questo preserva
--    la tracciabilità (audit trail) necessaria per generare le notifiche e per
--    mostrare all'utente la cronologia delle proprie candidature. A livello di
--    business logic e di UI, una candidatura 'cancelled_auto' è trattata
--    esattamente come "rimossa": non compare più tra i candidati pendenti del
--    creatore, e l'utente la vede come "Ritirata automaticamente".
--    Se si preferisce una cancellazione fisica reale, sostituire lo UPDATE
--    nella funzione applicationService.acceptApplication con una DELETE:
--    la struttura della transazione resta identica.
--
-- 2. Un utente PUÒ avere candidature 'accepted' su più proposte diverse SOLO
--    se è stato accettato su entrambe prima che scattasse la regola su una
--    delle due; una volta accettato su una proposta, tutte le sue candidature
--    'pending' verso le altre vengono chiuse automaticamente, quindi in pratica
--    un utente risulta "impegnato" su una sola proposta alla volta (a meno che
--    il creatore non lo accetti esplicitamente su più iniziative in rapida
--    successione — comportamento accettato per design).
-- ============================================================================

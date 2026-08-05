// backend/services/applicationService.js
//
// Logica di business per le candidature. La funzione `acceptApplication`
// implementa la REGOLA CRITICA descritta nelle specifiche:
//
//   Quando un creatore accetta un candidato:
//     1. la candidatura scelta passa a 'accepted'
//     2. TUTTE le altre candidature 'pending' dello stesso utente, su
//        QUALSIASI altra proposta, vengono chiuse automaticamente
//     3. l'utente riceve una notifica per ogni cambio di stato
//
// Tutto avviene in un'UNICA transazione con lock esplicito sulle righe
// coinvolte, per evitare race condition (es. due creatori che accettano lo
// stesso utente in contemporanea su due proposte diverse).

const { withTransaction } = require('../db');
const { createNotification } = require('./notificationService');

class ApplicationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Crea una nuova candidatura di `applicantId` per `proposalId`.
 * Consente la multi-candidatura: lo stesso utente può avere candidature
 * 'pending' su proposte diverse in contemporanea.
 */
async function submitApplication({ proposalId, applicantId, message }) {
  return withTransaction(async (client) => {
    const proposal = await client.query(
      `SELECT id, creator_id, status, positions_available
       FROM proposals WHERE id = $1 FOR SHARE`,
      [proposalId]
    );
    if (proposal.rowCount === 0) {
      throw new ApplicationError('Proposta non trovata.', 404);
    }
    const p = proposal.rows[0];

    if (p.status !== 'published') {
      throw new ApplicationError('Questa proposta non accetta più candidature.', 409);
    }
    if (p.creator_id === applicantId) {
      throw new ApplicationError('Non puoi candidarti alla tua stessa proposta.', 400);
    }

    // Il vincolo UNIQUE(proposal_id, applicant_id) impedisce comunque i doppioni
    // a livello di DB; qui restituiamo un errore applicativo più leggibile.
    const existing = await client.query(
      `SELECT id, status FROM applications WHERE proposal_id = $1 AND applicant_id = $2`,
      [proposalId, applicantId]
    );
    if (existing.rowCount > 0 && existing.rows[0].status !== 'cancelled_auto') {
      throw new ApplicationError('Hai già inviato una candidatura per questa proposta.', 409);
    }

    const inserted = await client.query(
      `INSERT INTO applications (proposal_id, applicant_id, message, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (proposal_id, applicant_id)
       DO UPDATE SET status = 'pending', message = EXCLUDED.message,
                      decided_at = NULL, decision_reason = NULL
       RETURNING *`,
      [proposalId, applicantId, message || null]
    );

    const application = inserted.rows[0];

    await createNotification(client, {
      userId: p.creator_id,
      type: 'application_received',
      title: 'Nuova candidatura ricevuta',
      body: `Hai ricevuto una nuova candidatura per la tua proposta.`,
      relatedProposalId: proposalId,
      relatedApplicationId: application.id,
    });

    return application;
  });
}

/**
 * REGOLA CRITICA: accetta un candidato e applica l'esclusività automatica.
 *
 * @param {string} applicationId  ID della candidatura da accettare
 * @param {string} creatorId      ID dell'utente che sta compiendo l'azione
 *                                (deve essere il creatore della proposta)
 */
async function acceptApplication(applicationId, creatorId) {
  return withTransaction(async (client) => {
    // 1) Carichiamo la candidatura target CON LOCK e verifichiamo i permessi.
    //    Il JOIN su proposals ci dà anche il creator_id per l'autorizzazione.
    const targetRes = await client.query(
      `SELECT a.id, a.proposal_id, a.applicant_id, a.status,
              p.creator_id, p.title AS proposal_title
       FROM applications a
       JOIN proposals p ON p.id = a.proposal_id
       WHERE a.id = $1
       FOR UPDATE OF a`,
      [applicationId]
    );

    if (targetRes.rowCount === 0) {
      throw new ApplicationError('Candidatura non trovata.', 404);
    }
    const target = targetRes.rows[0];

    if (target.creator_id !== creatorId) {
      throw new ApplicationError('Non sei autorizzato a gestire questa candidatura.', 403);
    }
    if (target.status !== 'pending') {
      throw new ApplicationError('Questa candidatura è già stata gestita.', 409);
    }

    // 2) Blocchiamo TUTTE le candidature pendenti dello stesso candidato
    //    (comprese quelle su altre proposte) per evitare race condition:
    //    due creatori non potranno mai accettare lo stesso utente in parallelo
    //    su proposte diverse, perché il secondo troverà le righe già lockate
    //    e, dopo il commit del primo, le troverà non più 'pending'.
    const otherPendingRes = await client.query(
      `SELECT a.id, a.proposal_id, p.title AS proposal_title, p.creator_id
       FROM applications a
       JOIN proposals p ON p.id = a.proposal_id
       WHERE a.applicant_id = $1
         AND a.status = 'pending'
         AND a.id <> $2
       FOR UPDATE OF a`,
      [target.applicant_id, applicationId]
    );

    // 3) Accettiamo la candidatura target.
    await client.query(
      `UPDATE applications
       SET status = 'accepted', decided_at = now(), decision_reason = NULL
       WHERE id = $1`,
      [applicationId]
    );

    await createNotification(client, {
      userId: target.applicant_id,
      type: 'application_accepted',
      title: 'Candidatura accettata!',
      body: `Sei stato selezionato per la proposta "${target.proposal_title}".`,
      relatedProposalId: target.proposal_id,
      relatedApplicationId: target.id,
    });

    // 4) Chiudiamo automaticamente tutte le altre candidature pendenti
    //    dello stesso utente e notifichiamo sia lui sia i rispettivi creatori.
    for (const other of otherPendingRes.rows) {
      await client.query(
        `UPDATE applications
         SET status = 'cancelled_auto',
             decided_at = now(),
             decision_reason = $2
         WHERE id = $1`,
        [
          other.id,
          `Ritirata automaticamente: candidato selezionato per un'altra proposta.`,
        ]
      );

      await createNotification(client, {
        userId: target.applicant_id,
        type: 'application_auto_cancelled',
        title: 'Candidatura ritirata automaticamente',
        body: `La tua candidatura per "${other.proposal_title}" è stata ritirata perché sei stato accettato per "${target.proposal_title}".`,
        relatedProposalId: other.proposal_id,
        relatedApplicationId: other.id,
      });

      // Facoltativo ma utile: avvisa anche l'altro creatore che il candidato
      // non è più disponibile, così può muoversi su altri candidati.
      await createNotification(client, {
        userId: other.creator_id,
        type: 'application_auto_cancelled',
        title: 'Un candidato non è più disponibile',
        body: `Un candidato che si era proposto per "${other.proposal_title}" è stato selezionato altrove e la sua candidatura è stata ritirata automaticamente.`,
        relatedProposalId: other.proposal_id,
        relatedApplicationId: other.id,
      });
    }

    return {
      accepted: applicationId,
      autoCancelledCount: otherPendingRes.rowCount,
      autoCancelledProposalIds: otherPendingRes.rows.map((r) => r.proposal_id),
    };
  });
}

/**
 * Rifiuta una candidatura (nessun effetto sulle altre candidature dell'utente).
 */
async function rejectApplication(applicationId, creatorId) {
  return withTransaction(async (client) => {
    const targetRes = await client.query(
      `SELECT a.id, a.applicant_id, a.status, p.creator_id, p.title AS proposal_title, a.proposal_id
       FROM applications a
       JOIN proposals p ON p.id = a.proposal_id
       WHERE a.id = $1
       FOR UPDATE OF a`,
      [applicationId]
    );
    if (targetRes.rowCount === 0) throw new ApplicationError('Candidatura non trovata.', 404);
    const target = targetRes.rows[0];

    if (target.creator_id !== creatorId) {
      throw new ApplicationError('Non sei autorizzato a gestire questa candidatura.', 403);
    }
    if (target.status !== 'pending') {
      throw new ApplicationError('Questa candidatura è già stata gestita.', 409);
    }

    await client.query(
      `UPDATE applications SET status = 'rejected', decided_at = now() WHERE id = $1`,
      [applicationId]
    );

    await createNotification(client, {
      userId: target.applicant_id,
      type: 'application_rejected',
      title: 'Candidatura non selezionata',
      body: `La tua candidatura per "${target.proposal_title}" non è stata selezionata questa volta.`,
      relatedProposalId: target.proposal_id,
      relatedApplicationId: target.id,
    });

    return { rejected: applicationId };
  });
}

module.exports = {
  ApplicationError,
  submitApplication,
  acceptApplication,
  rejectApplication,
};

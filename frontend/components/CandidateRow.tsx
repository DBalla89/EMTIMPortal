'use client';
// components/CandidateRow.tsx
// Riga candidato nella dashboard del creatore con accetta/rifiuta + conferma.
// Usa il client API autenticato.

import { useState } from 'react';
import { api, type ApplicationWithApplicant } from '@/lib/api';
import StatusBadge from './StatusBadge';

interface CandidateRowProps {
  application: ApplicationWithApplicant;
  onDecided: (applicationId: string, action: 'accept' | 'reject') => void;
}

export default function CandidateRow({ application, onDecided }: CandidateRowProps) {
  const [busy, setBusy] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { id, full_name, headline, avatar_url, message, status } = application;

  async function decide(action: 'accept' | 'reject') {
    setBusy(true);
    setError(null);
    try {
      if (action === 'accept') {
        await api.applications.accept(id);
      } else {
        await api.applications.reject(id);
      }
      onDecided(id, action);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore. Riprova.');
    } finally {
      setBusy(false);
      setConfirmAccept(false);
    }
  }

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center
                        text-brand-700 font-semibold text-sm flex-shrink-0">
          {avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar_url} alt={full_name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            full_name?.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-ink">{full_name}</p>
            <StatusBadge status={status} />
          </div>
          {headline && <p className="text-xs text-ink-muted">{headline}</p>}
          {message && (
            <div className="mt-2 p-3 rounded-lg bg-surface-muted border border-surface-border">
              <p className="text-sm text-ink whitespace-pre-wrap">{message}</p>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-banner mt-3 text-xs">{error}</div>}

      {/* Azioni — solo su candidature pending */}
      {status === 'pending' && (
        <div className="flex gap-2 mt-4">
          {confirmAccept ? (
            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2
                            p-3 rounded-xl bg-brand-50 border border-brand-100">
              <p className="text-xs text-brand-800 flex-1">
                ⚠️ Confermando, tutte le altre candidature pendenti di{' '}
                <strong>{full_name}</strong> verranno ritirate automaticamente.
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  disabled={busy}
                  onClick={() => decide('accept')}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  {busy ? '...' : 'Conferma'}
                </button>
                <button
                  onClick={() => setConfirmAccept(false)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => setConfirmAccept(true)}
                className="btn-primary flex-1"
              >
                Accetta
              </button>
              <button
                disabled={busy}
                onClick={() => decide('reject')}
                className="btn-secondary flex-1"
              >
                Rifiuta
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

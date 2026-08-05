// components/CandidateRow.jsx
'use client';
import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function CandidateRow({ application, onDecided }) {
  const [busy, setBusy] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const { id, full_name, headline, avatar_url, message, status } = application;

  async function decide(action) {
    setBusy(true);
    try {
      const res = await fetch(`/api/applications/${id}/${action}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDecided(id, action, data);
    } catch (err) {
      alert(err.message); // in produzione: toast component
    } finally {
      setBusy(false);
      setConfirmAccept(false);
    }
  }

  return (
    <div className="p-4 rounded-card border border-surface-border bg-surface">
      <div className="flex items-start gap-3">
        <img
          src={avatar_url || '/avatar-placeholder.png'}
          alt={full_name}
          className="w-10 h-10 rounded-full object-cover bg-gray-100 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink truncate">{full_name}</p>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-ink-muted mb-2">{headline}</p>
          {message && <p className="text-sm text-ink bg-surface-muted rounded-lg p-3">{message}</p>}
        </div>
      </div>

      {status === 'pending' && (
        <div className="flex gap-2 mt-4">
          {confirmAccept ? (
            <div className="flex-1 flex items-center gap-2 p-2.5 rounded-lg bg-brand-50 border border-brand-100">
              <span className="text-xs text-brand-700 flex-1">
                Confermi? Le altre candidature pendenti di questo utente verranno ritirate automaticamente.
              </span>
              <button
                disabled={busy}
                onClick={() => decide('accept')}
                className="px-3 py-1.5 rounded-md bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600"
              >
                Conferma
              </button>
              <button
                onClick={() => setConfirmAccept(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:bg-surface"
              >
                Annulla
              </button>
            </div>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => setConfirmAccept(true)}
                className="flex-1 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold
                           hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                Accetta
              </button>
              <button
                disabled={busy}
                onClick={() => decide('reject')}
                className="flex-1 py-2 rounded-lg border border-surface-border text-sm font-medium text-ink
                           hover:bg-surface-muted disabled:opacity-60 transition-colors"
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

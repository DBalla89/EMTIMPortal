// components/ApplyModal.jsx
'use client';
import { useState } from 'react';

export default function ApplyModal({ proposalId, proposalTitle, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'invio.');
      onSuccess(data.application);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-ink mb-1">Candidati a questa proposta</h2>
        <p className="text-sm text-ink-muted mb-4">{proposalTitle}</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Messaggio di presentazione <span className="text-ink-muted font-normal">(opzionale)</span>
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Racconta perché sei la persona giusta per questa iniziativa..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-surface-border text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 mb-4"
          />

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border text-sm font-medium
                         text-ink hover:bg-surface-muted transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold
                         hover:bg-brand-600 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Invio in corso...' : 'Invia candidatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

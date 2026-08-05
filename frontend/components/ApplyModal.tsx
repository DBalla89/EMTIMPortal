'use client';
// components/ApplyModal.jsx → ApplyModal.tsx
// Modale di candidatura integrata con il client API autenticato.

import { useState } from 'react';
import { api, type Application } from '@/lib/api';

interface ApplyModalProps {
  proposalId: string;
  proposalTitle: string;
  onClose: () => void;
  onSuccess: (app: Application) => void;
}

export default function ApplyModal({
  proposalId,
  proposalTitle,
  onClose,
  onSuccess,
}: ApplyModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { application } = await api.applications.submit(proposalId, message || undefined);
      onSuccess(application);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'invio.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-card p-6 shadow-xl animate-slide-up">
        <h2 className="text-lg font-semibold text-ink mb-1">Candidati a questa proposta</h2>
        <p className="text-sm text-ink-muted mb-5 truncate">{proposalTitle}</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="apply-message" className="form-label">
            Messaggio di presentazione{' '}
            <span className="text-ink-muted font-normal">(opzionale)</span>
          </label>
          <textarea
            id="apply-message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Racconta perché sei la persona giusta per questa iniziativa, le tue competenze e motivazioni..."
            className="input-base resize-none mb-4"
          />

          {error && <div className="error-banner mb-4">{error}</div>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? 'Invio in corso...' : 'Invia candidatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

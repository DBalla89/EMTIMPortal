// components/CreatorDashboard.jsx
'use client';
import { useEffect, useState } from 'react';
import CandidateRow from './CandidateRow';

export default function CreatorDashboard({ proposalId, proposalTitle }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proposals/${proposalId}/applications`)
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .finally(() => setLoading(false));
  }, [proposalId]);

  // Quando un candidato viene accettato, il backend ha già ritirato
  // automaticamente le sue altre candidature pendenti (su ALTRE proposte:
  // qui vediamo solo questa proposta, quindi aggiorniamo solo la riga scelta).
  function handleDecided(applicationId, action) {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId
          ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected' }
          : a
      )
    );
  }

  const pending = applications.filter((a) => a.status === 'pending');
  const decided = applications.filter((a) => a.status !== 'pending');

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
          Gestione candidati
        </p>
        <h1 className="text-xl font-bold text-ink mb-6">{proposalTitle}</h1>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-card bg-surface border border-surface-border animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-ink-muted text-sm">
            Nessuna candidatura ricevuta ancora.
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-ink mb-3">
                  In attesa di decisione ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map((app) => (
                    <CandidateRow key={app.id} application={app} onDecided={handleDecided} />
                  ))}
                </div>
              </section>
            )}

            {decided.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-ink mb-3">Decisioni prese</h2>
                <div className="space-y-3">
                  {decided.map((app) => (
                    <CandidateRow key={app.id} application={app} onDecided={handleDecided} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

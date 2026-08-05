'use client';
// components/CreatorDashboard.tsx
// Lista candidati per una proposta con gestione accetta/rifiuta.
// Ora accetta initialApplications per evitare double-fetch dalla pagina parent.

import { useState } from 'react';
import { type ApplicationWithApplicant } from '@/lib/api';
import CandidateRow from './CandidateRow';

interface CreatorDashboardProps {
  proposalId: string;
  proposalTitle: string;
  initialApplications: ApplicationWithApplicant[];
}

export default function CreatorDashboard({
  proposalId: _proposalId,
  proposalTitle: _proposalTitle,
  initialApplications,
}: CreatorDashboardProps) {
  const [applications, setApplications] = useState<ApplicationWithApplicant[]>(initialApplications);

  function handleDecided(applicationId: string, action: 'accept' | 'reject') {
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

  if (applications.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="text-5xl mb-4">📭</div>
        <h2 className="text-lg font-semibold text-ink mb-2">Nessuna candidatura ricevuta</h2>
        <p className="text-sm text-ink-muted">
          Quando qualcuno si candiderà, lo troverai qui.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
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
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Decisioni prese ({decided.length})
          </h2>
          <div className="space-y-3 opacity-75">
            {decided.map((app) => (
              <CandidateRow key={app.id} application={app} onDecided={handleDecided} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

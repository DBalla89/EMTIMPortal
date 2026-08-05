'use client';
// app/dashboard/proposte/[id]/candidati/page.tsx
// Pagina di gestione candidati per una specifica proposta.
// Avvolge il componente CreatorDashboard esistente con autenticazione e fetch dei dati.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type Proposal, type ApplicationWithApplicant } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import CreatorDashboard from '@/components/CreatorDashboard';

export default function CandidatiPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const proposalId = params?.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [applications, setApplications] = useState<ApplicationWithApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
      return;
    }
    if (!user || !proposalId) return;

    Promise.all([
      api.proposals.mine(),
      api.applications.forProposal(proposalId),
    ])
      .then(([proposalsData, applicationsData]) => {
        const found = proposalsData.proposals.find((p) => p.id === proposalId);
        if (!found) {
          setError('Proposta non trovata o non sei il creatore.');
          return;
        }
        setProposal(found);
        setApplications(applicationsData.applications ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, proposalId, router]);

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-muted py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-8 w-64 rounded-lg bg-surface animate-pulse" />
          <div className="h-24 rounded-card bg-surface animate-pulse" />
          <div className="h-24 rounded-card bg-surface animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-ink-muted mb-6">{error}</p>
        <Link href="/dashboard" className="btn-primary">Torna alla dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="bg-surface border-b border-surface-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <nav className="flex items-center gap-2 text-sm text-ink-muted mb-3">
            <Link href="/dashboard" className="hover:text-brand-600">Dashboard</Link>
            <span>/</span>
            <span className="text-ink truncate max-w-[200px]">{proposal?.title}</span>
          </nav>
          <h1 className="text-xl font-bold text-ink">Gestione candidati</h1>
          <p className="text-sm text-ink-muted mt-1">{proposal?.title}</p>
        </div>
      </div>

      <CreatorDashboard
        proposalId={proposalId}
        proposalTitle={proposal?.title ?? ''}
        initialApplications={applications}
      />
    </div>
  );
}

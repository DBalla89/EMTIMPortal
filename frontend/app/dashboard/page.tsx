'use client';
// app/dashboard/page.tsx
// Dashboard del creatore: lista di tutte le sue proposte con contatori
// di candidature pendenti e accettate. Link per gestire i candidati di ciascuna.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type Proposal } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import StatusBadge from '@/components/StatusBadge';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
      return;
    }
    if (user) {
      api.proposals
        .mine()
        .then(({ proposals }) => setProposals(proposals ?? []))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="bg-surface border-b border-surface-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
                Dashboard
              </p>
              <h1 className="text-2xl font-bold text-ink">Le mie proposte</h1>
              <p className="text-sm text-ink-muted mt-1">
                Ciao, <strong>{user.full_name}</strong>. Gestisci qui le tue proposte e i candidati.
              </p>
            </div>
            <Link href="/proposte/nuova" className="btn-primary self-start sm:self-auto">
              + Nuova proposta
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-card bg-surface border border-surface-border animate-pulse" />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-ink mb-2">Nessuna proposta ancora</h2>
            <p className="text-sm text-ink-muted mb-6">
              Pubblica la tua prima proposta per iniziare a ricevere candidature.
            </p>
            <Link href="/proposte/nuova" className="btn-primary">
              Pubblica la prima proposta
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => (
              <ProposalRow key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalRow({ proposal: p }: { proposal: Proposal }) {
  const pendingCount = Number(p.pending_count ?? 0);
  const acceptedCount = Number(p.accepted_count ?? 0);

  return (
    <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-card-hover
                    transition-shadow duration-150 animate-slide-up">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {p.category && (
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
              {p.category}
            </span>
          )}
          <StatusBadge status={p.status} />
        </div>
        <Link
          href={`/proposte/${p.slug}`}
          className="text-base font-semibold text-ink hover:text-brand-600 transition-colors block truncate"
        >
          {p.title}
        </Link>
        <p className="text-xs text-ink-muted mt-1">
          Pubblicata il {new Date(p.created_at).toLocaleDateString('it-IT', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="text-center">
          <p className="text-xl font-bold text-brand-500">{pendingCount}</p>
          <p className="text-xs text-ink-muted">In attesa</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-600">{acceptedCount}</p>
          <p className="text-xs text-ink-muted">Accettati</p>
        </div>
        <Link
          href={`/dashboard/proposte/${p.id}/candidati`}
          className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
        >
          Gestisci candidati →
        </Link>
      </div>
    </div>
  );
}

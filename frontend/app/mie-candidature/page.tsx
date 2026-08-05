'use client';
// app/mie-candidature/page.tsx
// Pagina con tutte le candidature inviate dall'utente autenticato.
// Mostra lo stato di ciascuna e il link alla proposta.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type ApplicationWithProposal } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import StatusBadge from '@/components/StatusBadge';

export default function MieCandidaturePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
      return;
    }
    if (user) {
      api.applications
        .myApplications()
        .then(({ applications }) => setApplications(applications ?? []))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const grouped = {
    pending: applications.filter((a) => a.status === 'pending'),
    accepted: applications.filter((a) => a.status === 'accepted'),
    rejected: applications.filter((a) => a.status === 'rejected'),
    cancelled: applications.filter((a) => a.status === 'cancelled_auto'),
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="bg-surface border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            Il mio profilo
          </p>
          <h1 className="text-2xl font-bold text-ink">Le mie candidature</h1>
          <p className="text-sm text-ink-muted mt-1">
            {applications.length === 0
              ? 'Non hai ancora inviato candidature.'
              : `${applications.length} candidatura${applications.length > 1 ? 'e' : ''} inviate`}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-card bg-surface animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🙋</div>
            <h2 className="text-lg font-semibold text-ink mb-2">
              Nessuna candidatura inviata
            </h2>
            <p className="text-sm text-ink-muted mb-6">
              Esplora la bacheca e candidati ai progetti che ti interessano.
            </p>
            <Link href="/bacheca" className="btn-primary">
              Esplora la bacheca
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Accettate — evidenziate */}
            {grouped.accepted.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Accettate ({grouped.accepted.length})
                </h2>
                <div className="space-y-3">
                  {grouped.accepted.map((a) => (
                    <ApplicationCard key={a.id} app={a} />
                  ))}
                </div>
              </section>
            )}

            {/* In attesa */}
            {grouped.pending.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-brand-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  In attesa di risposta ({grouped.pending.length})
                </h2>
                <div className="space-y-3">
                  {grouped.pending.map((a) => (
                    <ApplicationCard key={a.id} app={a} />
                  ))}
                </div>
              </section>
            )}

            {/* Rifiutate */}
            {grouped.rejected.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-ink-muted mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Non selezionate ({grouped.rejected.length})
                </h2>
                <div className="space-y-3 opacity-75">
                  {grouped.rejected.map((a) => (
                    <ApplicationCard key={a.id} app={a} />
                  ))}
                </div>
              </section>
            )}

            {/* Ritirate automaticamente */}
            {grouped.cancelled.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-ink-muted mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Ritirate automaticamente ({grouped.cancelled.length})
                </h2>
                <div className="space-y-3 opacity-60">
                  {grouped.cancelled.map((a) => (
                    <ApplicationCard key={a.id} app={a} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ app }: { app: ApplicationWithProposal }) {
  return (
    <div className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow animate-slide-up">
      <div className="flex-1 min-w-0">
        <Link
          href={`/proposte/${app.proposal_slug}`}
          className="text-sm font-semibold text-ink hover:text-brand-600 transition-colors block truncate"
        >
          {app.proposal_title}
        </Link>
        <p className="text-xs text-ink-muted mt-0.5">
          Inviata il {new Date(app.created_at).toLocaleDateString('it-IT', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
        {app.message && (
          <p className="text-xs text-ink-muted mt-1.5 line-clamp-2 italic">
            &ldquo;{app.message}&rdquo;
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <StatusBadge status={app.status} />
      </div>
    </div>
  );
}

'use client';
// app/proposte/[slug]/page.tsx
// Pagina di dettaglio di una proposta. Carica i dati lato client per gestire
// correttamente il token JWT (che esiste solo nel browser).

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type Proposal, type Application } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import StatusBadge from '@/components/StatusBadge';
import ApplyModal from '@/components/ApplyModal';

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.proposals
      .get(slug)
      .then(({ proposal, myApplication }) => {
        setProposal(proposal);
        setMyApplication(myApplication);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-4">
          <div className="h-6 w-24 rounded bg-surface animate-pulse" />
          <div className="h-10 w-3/4 rounded-lg bg-surface animate-pulse" />
          <div className="h-4 w-full rounded bg-surface animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-surface animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-surface animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-ink mb-2">Proposta non trovata</h1>
        <p className="text-ink-muted mb-6">Questa proposta non esiste o è stata rimossa.</p>
        <Link href="/bacheca" className="btn-primary">Torna alla bacheca</Link>
      </div>
    );
  }

  const isOwner = proposal.creator_id === user?.id;

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-ink-muted mb-6">
          <Link href="/bacheca" className="hover:text-brand-600 transition-colors">Bacheca</Link>
          <span>/</span>
          <span className="text-ink truncate max-w-[200px]">{proposal.title}</span>
        </nav>

        {/* Header proposta */}
        <div className="card p-6 sm:p-8 mb-6 animate-fade-in">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            {proposal.category && (
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50
                               px-3 py-1 rounded-full border border-brand-100">
                {proposal.category}
              </span>
            )}
            <StatusBadge status={proposal.status} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-5">{proposal.title}</h1>

          {/* Autore */}
          <div className="flex items-center gap-3 pb-6 border-b border-surface-border mb-6">
            <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center
                            text-brand-700 font-semibold text-base flex-shrink-0">
              {proposal.creator_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{proposal.creator_name}</p>
              {proposal.creator_headline && (
                <p className="text-xs text-ink-muted">{proposal.creator_headline}</p>
              )}
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-ink-muted">
                {new Date(proposal.created_at).toLocaleDateString('it-IT', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
              {proposal.positions_available > 0 && (
                <p className="text-xs font-medium text-brand-600 mt-0.5">
                  {proposal.positions_available} posizione{proposal.positions_available > 1 ? 'i' : ''} disponibile{proposal.positions_available > 1 ? 'i' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Descrizione */}
          <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap mb-6">
            {proposal.description}
          </div>

          {/* PDF allegato */}
          <a
            href={proposal.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-surface-border
                       bg-surface-muted hover:border-brand-400 hover:bg-brand-50
                       transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center
                            text-white font-bold text-xs flex-shrink-0 group-hover:bg-brand-600 transition-colors">
              PDF
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{proposal.pdf_filename}</p>
              <p className="text-xs text-ink-muted">Documento di presentazione — apri o scarica</p>
            </div>
            <svg className="w-4 h-4 text-ink-muted group-hover:text-brand-500 transition-colors flex-shrink-0"
                 fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-4-4m4 4l4-4" />
            </svg>
          </a>
        </div>

        {/* CTA candidatura / gestione */}
        {!isOwner && proposal.status === 'published' && (
          <div className="sticky bottom-4 animate-fade-in">
            {myApplication ? (
              <div className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">La tua candidatura</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Inviata il {new Date(myApplication.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <StatusBadge status={myApplication.status} />
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!user) { router.push('/auth/login'); return; }
                  setShowModal(true);
                }}
                className="btn-primary w-full py-3.5 text-base shadow-md"
              >
                Candidati a questa proposta →
              </button>
            )}
          </div>
        )}

        {isOwner && (
          <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center
                          justify-between gap-3 animate-fade-in">
            <div>
              <p className="text-sm font-semibold text-ink">Sei il creatore di questa proposta</p>
              <p className="text-xs text-ink-muted mt-0.5">Gestisci i candidati dalla tua dashboard</p>
            </div>
            <Link
              href={`/dashboard/proposte/${proposal.id}/candidati`}
              className="btn-primary whitespace-nowrap"
            >
              Gestisci candidati
            </Link>
          </div>
        )}

        {proposal.status === 'closed' && (
          <div className="card p-4 text-center text-ink-muted text-sm">
            Questa proposta non accetta più candidature.
          </div>
        )}
      </div>

      {showModal && (
        <ApplyModal
          proposalId={proposal.id}
          proposalTitle={proposal.title}
          onClose={() => setShowModal(false)}
          onSuccess={(app) => {
            setMyApplication(app);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

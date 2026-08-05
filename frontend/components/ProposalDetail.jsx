// components/ProposalDetail.jsx
'use client';
import { useState } from 'react';
import ApplyModal from './ApplyModal';
import StatusBadge from './StatusBadge';

export default function ProposalDetail({ proposal, currentUserId, myApplication }) {
  const [showModal, setShowModal] = useState(false);
  const [application, setApplication] = useState(myApplication);

  const isOwner = proposal.creator_id === currentUserId;

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            {proposal.category}
          </span>
          <StatusBadge status={proposal.status} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-4">{proposal.title}</h1>

        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-surface-border">
          <img
            src={proposal.creator_avatar || '/avatar-placeholder.png'}
            alt={proposal.creator_name}
            className="w-10 h-10 rounded-full object-cover bg-gray-100"
          />
          <div>
            <p className="text-sm font-medium text-ink">{proposal.creator_name}</p>
            <p className="text-xs text-ink-muted">{proposal.creator_headline}</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-ink mb-8 whitespace-pre-wrap">
          {proposal.description}
        </div>

        {/* Documento allegato */}
        <a
          href={proposal.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 rounded-card border border-surface-border
                     bg-surface hover:border-brand-400 transition-colors mb-8"
        >
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-xs">
            PDF
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{proposal.pdf_filename}</p>
            <p className="text-xs text-ink-muted">Documento di presentazione — apri o scarica</p>
          </div>
        </a>

        {/* CTA candidatura */}
        {!isOwner && (
          <div className="sticky bottom-4">
            {application ? (
              <div className="flex items-center justify-between p-4 rounded-card bg-surface border border-surface-border shadow-card">
                <span className="text-sm text-ink">La tua candidatura:</span>
                <StatusBadge status={application.status} />
              </div>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-3.5 rounded-lg bg-brand-500 text-white font-semibold
                           hover:bg-brand-600 transition-colors shadow-sm"
              >
                Candidati a questa proposta
              </button>
            )}
          </div>
        )}

        {isOwner && (
          <a
            href={`/dashboard/proposte/${proposal.id}/candidati`}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-ink text-white text-sm font-semibold
                       hover:bg-gray-800 transition-colors"
          >
            Gestisci candidati
          </a>
        )}
      </div>

      {showModal && (
        <ApplyModal
          proposalId={proposal.id}
          proposalTitle={proposal.title}
          onClose={() => setShowModal(false)}
          onSuccess={(app) => {
            setApplication(app);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

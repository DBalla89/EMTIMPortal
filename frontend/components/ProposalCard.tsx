// components/ProposalCard.tsx
// Card di una proposta nella bacheca pubblica.

import Link from 'next/link';
import { type Proposal } from '@/lib/api';
import StatusBadge from './StatusBadge';

interface ProposalCardProps {
  proposal: Proposal;
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const {
    slug,
    title,
    summary,
    category,
    creator_name,
    positions_available,
    pending_applications,
    created_at,
  } = proposal;

  return (
    <Link
      href={`/proposte/${slug}`}
      className="group block card p-5 hover:border-brand-400 hover:shadow-card-hover
                 transition-all duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {category ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600
                           bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100 flex-shrink-0">
            {category}
          </span>
        ) : (
          <span />
        )}
        <StatusBadge status="published" />
      </div>

      {/* Titolo */}
      <h3 className="text-base font-semibold text-ink mb-2 group-hover:text-brand-600
                     transition-colors line-clamp-2 leading-snug">
        {title}
      </h3>

      {/* Sommario */}
      {summary && (
        <p className="text-sm text-ink-muted line-clamp-2 mb-4 leading-relaxed">{summary}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-border mt-auto">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar iniziale */}
          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center
                          text-brand-700 font-semibold text-[10px] flex-shrink-0">
            {creator_name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-ink-muted truncate">{creator_name}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-ink-muted">
          <span>
            {pending_applications ?? 0} candidat{(pending_applications ?? 0) === 1 ? 'o' : 'i'}
          </span>
          {positions_available > 0 && (
            <>
              <span className="text-surface-border">·</span>
              <span className="text-brand-600 font-medium">
                {positions_available} pos.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Data */}
      <p className="text-[10px] text-ink-muted mt-2">
        {new Date(created_at).toLocaleDateString('it-IT', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </p>
    </Link>
  );
}

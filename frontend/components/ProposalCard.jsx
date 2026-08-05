// components/ProposalCard.jsx
import Link from 'next/link';
import StatusBadge from './StatusBadge';

export default function ProposalCard({ proposal }) {
  const {
    slug, title, summary, category, creator_name, creator_avatar,
    positions_available, pending_applications, created_at,
  } = proposal;

  return (
    <Link
      href={`/proposte/${slug}`}
      className="group block bg-surface border border-surface-border rounded-card p-5 shadow-card
                 hover:border-brand-400 hover:shadow-md transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {category && (
          <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            {category}
          </span>
        )}
        <StatusBadge status="published" />
      </div>

      <h3 className="text-lg font-semibold text-ink mb-1.5 group-hover:text-brand-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-ink-muted line-clamp-2 mb-4">{summary}</p>

      <div className="flex items-center justify-between pt-4 border-t border-surface-border">
        <div className="flex items-center gap-2">
          <img
            src={creator_avatar || '/avatar-placeholder.png'}
            alt={creator_name}
            className="w-7 h-7 rounded-full object-cover bg-gray-100"
          />
          <span className="text-sm text-ink-muted">{creator_name}</span>
        </div>
        <span className="text-xs text-ink-muted">
          {pending_applications} candidat{pending_applications === 1 ? 'o' : 'i'}
        </span>
      </div>
    </Link>
  );
}

// components/StatusBadge.jsx
// Badge di stato coerente in tutta l'app. L'arancione è riservato allo stato
// "pending" (richiede attenzione) e alle CTA; verde/rosso/grigio per gli esiti.

const STYLES = {
  pending: 'bg-brand-100 text-brand-700 border border-brand-400/40',
  accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  cancelled_auto: 'bg-gray-100 text-ink-muted border border-surface-border',
  published: 'bg-brand-50 text-brand-600 border border-brand-100',
  closed: 'bg-gray-100 text-ink-muted border border-surface-border',
};

const LABELS = {
  pending: 'In attesa',
  accepted: 'Accettato',
  rejected: 'Rifiutato',
  cancelled_auto: 'Ritirata automaticamente',
  published: 'Attiva',
  closed: 'Chiusa',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        STYLES[status] || STYLES.closed
      }`}
    >
      {LABELS[status] || status}
    </span>
  );
}

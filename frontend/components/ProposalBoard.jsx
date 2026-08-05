// components/ProposalBoard.jsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProposalCard from './ProposalCard';

const CATEGORIES = ['Tutte', 'Tech', 'Design', 'Business', 'Sociale', 'Ricerca'];

export default function ProposalBoard() {
  const [proposals, setProposals] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tutte');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category !== 'Tutte') params.set('category', category);

    setLoading(true);
    fetch(`/api/proposals?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setProposals(data.proposals || []))
      .finally(() => setLoading(false));
  }, [query, category]);

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* Header */}
      <header className="bg-surface border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">Bacheca proposte</h1>
          <Link
            href="/proposte/nuova"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-500 text-white
                       text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm"
          >
            + Pubblica una proposta
          </Link>
        </div>
      </header>

      {/* Filtri */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Cerca per titolo o parola chiave..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-surface-border bg-surface
                       text-sm text-ink placeholder:text-ink-muted
                       focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  category === c
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface border border-surface-border text-ink-muted hover:border-brand-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Griglia proposte */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-card bg-surface border border-surface-border animate-pulse" />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-20 text-ink-muted">
            Nessuna proposta trovata. Prova a modificare la ricerca.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

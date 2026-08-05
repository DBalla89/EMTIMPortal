'use client';
// app/bacheca/BachecaClient.tsx
// Bacheca pubblica con ricerca full-text, filtri per categoria, paginazione e
// skeleton loader durante il fetch.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, type Proposal } from '@/lib/api';
import ProposalCard from '@/components/ProposalCard';
import { useAuth } from '@/lib/auth';

const CATEGORIES = ['Tutte', 'Tech', 'Design', 'Business', 'Sociale', 'Ricerca', 'Altro'];

export default function BachecaClient() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tutte');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Debounce query di ricerca
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      api.proposals
        .list({ q: query || undefined, category: category !== 'Tutte' ? category : undefined })
        .then((data) => {
          setProposals(data.proposals ?? []);
          setTotal(data.total ?? 0);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, category]);

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* Header */}
      <div className="bg-surface border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
                Project Work EMTIM XVIII
              </p>
              <h1 className="text-2xl font-bold text-ink">Bacheca proposte</h1>
              {!loading && (
                <p className="text-sm text-ink-muted mt-1">
                  {total} proposta{total !== 1 ? 'e' : ''} pubblicate
                </p>
              )}
            </div>
            {user && (
              <Link
                href="/proposte/nuova"
                className="btn-primary self-start sm:self-auto"
              >
                + Pubblica proposta
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Barra ricerca + filtri */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cerca per titolo o parola chiave..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-base pl-10"
            />
          </div>

          {/* Filtri categoria */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  category === c
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-surface border border-surface-border text-ink-muted hover:border-brand-400 hover:text-ink'
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
              <div
                key={i}
                className="h-52 rounded-card bg-surface border border-surface-border animate-pulse"
              />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-ink mb-2">Nessuna proposta trovata</h2>
            <p className="text-sm text-ink-muted mb-6">
              {query || category !== 'Tutte'
                ? 'Prova a modificare i filtri di ricerca.'
                : 'Non ci sono ancora proposte pubblicate.'}
            </p>
            {user && (
              <Link href="/proposte/nuova" className="btn-primary">
                Pubblica la prima proposta
              </Link>
            )}
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

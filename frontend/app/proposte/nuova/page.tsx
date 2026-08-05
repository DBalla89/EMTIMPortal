'use client';
// app/proposte/nuova/page.tsx
// Form per la pubblicazione di una nuova proposta.
// Richiede autenticazione — redirect a login se non autenticato.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const CATEGORIES = ['Tech', 'Design', 'Business', 'Sociale', 'Ricerca', 'Altro'];

export default function NuovaProposta() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    summary: '',
    description: '',
    category: '',
    positionsAvailable: '1',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect se non autenticato
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      setError('Il documento deve essere un file PDF.');
      setPdfFile(null);
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setError('Il file PDF non può superare i 10 MB.');
      setPdfFile(null);
      return;
    }
    setError(null);
    setPdfFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pdfFile) {
      setError('Allegare un documento PDF è obbligatorio.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('summary', form.summary);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('positionsAvailable', form.positionsAvailable);
      formData.append('document', pdfFile);

      const { proposal } = await api.proposals.create(formData);
      setSuccess(true);
      // Breve delay poi redirect alla proposta appena creata
      setTimeout(() => router.push(`/proposte/${proposal.slug}`), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante la pubblicazione.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-surface-muted py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-ink-muted mb-4">
            <Link href="/bacheca" className="hover:text-brand-600">Bacheca</Link>
            <span>/</span>
            <span className="text-ink">Nuova proposta</span>
          </nav>
          <h1 className="text-2xl font-bold text-ink">Pubblica una proposta</h1>
          <p className="text-sm text-ink-muted mt-1">
            Presenta la tua idea al gruppo EMTIM XVIII e trova collaboratori.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6 animate-slide-up">
          {/* Titolo */}
          <div>
            <label htmlFor="title" className="form-label">
              Titolo della proposta <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={handleChange}
              className="input-base"
              placeholder="es. Analisi del mercato EV in Italia"
            />
            <p className="text-xs text-ink-muted mt-1.5">{form.title.length}/200 caratteri</p>
          </div>

          {/* Categoria + Posizioni */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="form-label">Categoria</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input-base appearance-none cursor-pointer"
              >
                <option value="">Seleziona...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="positionsAvailable" className="form-label">
                Posizioni disponibili
              </label>
              <input
                id="positionsAvailable"
                name="positionsAvailable"
                type="number"
                min="1"
                max="20"
                value={form.positionsAvailable}
                onChange={handleChange}
                className="input-base"
              />
            </div>
          </div>

          {/* Sommario */}
          <div>
            <label htmlFor="summary" className="form-label">
              Sommario{' '}
              <span className="text-ink-muted font-normal">(mostrato nella bacheca)</span>
            </label>
            <input
              id="summary"
              name="summary"
              type="text"
              maxLength={300}
              value={form.summary}
              onChange={handleChange}
              className="input-base"
              placeholder="Breve descrizione (max 300 caratteri)"
            />
          </div>

          {/* Descrizione */}
          <div>
            <label htmlFor="description" className="form-label">
              Descrizione completa <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={8}
              value={form.description}
              onChange={handleChange}
              className="input-base resize-none"
              placeholder="Descrivi in dettaglio la proposta, gli obiettivi, le competenze ricercate..."
            />
          </div>

          {/* Upload PDF */}
          <div>
            <label className="form-label">
              Documento di presentazione (PDF) <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`mt-1 flex flex-col items-center justify-center px-6 py-8 rounded-xl border-2 border-dashed
                          cursor-pointer transition-colors
                          ${pdfFile
                            ? 'border-brand-400 bg-brand-50'
                            : 'border-surface-border bg-surface hover:border-brand-400 hover:bg-brand-50/40'
                          }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {pdfFile ? (
                <>
                  <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm mb-2">
                    PDF
                  </div>
                  <p className="text-sm font-medium text-ink">{pdfFile.name}</p>
                  <p className="text-xs text-ink-muted mt-1">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB · Clicca per cambiare
                  </p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-ink-muted mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium text-ink">Clicca per caricare il PDF</p>
                  <p className="text-xs text-ink-muted mt-1">Max 10 MB</p>
                </>
              )}
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {success && (
            <div className="success-banner flex items-center gap-2">
              <span>✓</span>
              Proposta pubblicata! Reindirizzamento in corso...
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/bacheca" className="btn-secondary flex-1">
              Annulla
            </Link>
            <button
              type="submit"
              disabled={submitting || success}
              className="btn-primary flex-1"
            >
              {submitting ? 'Pubblicazione in corso...' : 'Pubblica proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

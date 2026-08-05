'use client';
// app/auth/registrati/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function RegistratiPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    headline: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm_password) {
      setError('Le password non coincidono.');
      return;
    }
    if (form.password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await api.auth.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        headline: form.headline || undefined,
      });
      login(token, user);
      router.push('/bacheca');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-surface-muted">
      <div className="w-full max-w-md">
        <div className="card p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">PW</span>
            </div>
            <h1 className="text-2xl font-bold text-ink">Crea il tuo account</h1>
            <p className="text-sm text-ink-muted mt-1">Project Work EMTIM XVIII Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="form-label">
                Nome e cognome <span className="text-rose-500">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                value={form.full_name}
                onChange={handleChange}
                className="input-base"
                placeholder="Mario Rossi"
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="input-base"
                placeholder="mario.rossi@email.it"
              />
            </div>

            <div>
              <label htmlFor="headline" className="form-label">
                Titolo professionale{' '}
                <span className="text-ink-muted font-normal">(opzionale)</span>
              </label>
              <input
                id="headline"
                name="headline"
                type="text"
                value={form.headline}
                onChange={handleChange}
                className="input-base"
                placeholder="es. Project Manager | Milano"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                className="input-base"
                placeholder="Almeno 8 caratteri"
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="form-label">
                Conferma password <span className="text-rose-500">*</span>
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirm_password}
                onChange={handleChange}
                className="input-base"
                placeholder="Ripeti la password"
              />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? 'Registrazione in corso...' : 'Crea account'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted mt-6">
            Hai già un account?{' '}
            <Link href="/auth/login" className="text-brand-600 font-medium hover:text-brand-700">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';
// app/auth/login/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.auth.login(form);
      login(token, user);
      router.push('/bacheca');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante il login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-surface-muted">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">PW</span>
            </div>
            <h1 className="text-2xl font-bold text-ink">Accedi al portale</h1>
            <p className="text-sm text-ink-muted mt-1">Project Work EMTIM XVIII</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">Email</label>
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
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className="input-base"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted mt-6">
            Non hai ancora un account?{' '}
            <Link href="/auth/registrati" className="text-brand-600 font-medium hover:text-brand-700">
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

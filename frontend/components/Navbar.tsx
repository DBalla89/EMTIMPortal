'use client';
// components/Navbar.tsx
// Navbar principale del portale. Mostra link di navigazione, notifiche e
// il menu utente se autenticato, oppure i pulsanti Login/Registrati.

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push('/');
  }

  const navLinks = user
    ? [
        { href: '/bacheca', label: 'Bacheca' },
        { href: '/dashboard', label: 'Le mie proposte' },
        { href: '/mie-candidature', label: 'Le mie candidature' },
      ]
    : [{ href: '/bacheca', label: 'Bacheca' }];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-surface-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm
                          group-hover:bg-brand-600 transition-colors">
            <span className="text-white font-bold text-sm">PW</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-ink">EMTIM XVIII</span>
            <span className="block text-[10px] text-ink-muted leading-none tracking-wide">
              Project Work Portal
            </span>
          </div>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Azioni destra */}
        <div className="flex items-center gap-2">
          {!loading && (
            <>
              {user ? (
                <>
                  {/* Pubblica proposta — CTA visibile su desktop */}
                  <Link
                    href="/proposte/nuova"
                    className="hidden sm:inline-flex btn-primary text-xs px-3.5 py-2"
                  >
                    + Pubblica proposta
                  </Link>

                  {/* Notifiche */}
                  <NotificationBell />

                  {/* Avatar / Menu utente */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen((o) => !o)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-muted transition-colors"
                      aria-label="Menu utente"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center
                                      text-brand-700 font-semibold text-sm flex-shrink-0">
                        {user.full_name?.charAt(0).toUpperCase() ?? 'U'}
                      </div>
                      <span className="hidden lg:block text-sm font-medium text-ink max-w-[120px] truncate">
                        {user.full_name}
                      </span>
                      <ChevronIcon />
                    </button>

                    {menuOpen && (
                      <>
                        {/* Overlay per chiudere */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-1.5 w-52 bg-surface border border-surface-border
                                        rounded-card shadow-card-hover z-20 animate-slide-up overflow-hidden">
                          <div className="px-4 py-3 border-b border-surface-border">
                            <p className="text-sm font-semibold text-ink truncate">{user.full_name}</p>
                            <p className="text-xs text-ink-muted truncate">{user.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/dashboard"
                              onClick={() => setMenuOpen(false)}
                              className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-muted"
                            >
                              Le mie proposte
                            </Link>
                            <Link
                              href="/mie-candidature"
                              onClick={() => setMenuOpen(false)}
                              className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-muted"
                            >
                              Le mie candidature
                            </Link>
                            <Link
                              href="/proposte/nuova"
                              onClick={() => setMenuOpen(false)}
                              className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-muted sm:hidden"
                            >
                              Pubblica proposta
                            </Link>
                            <hr className="my-1 border-surface-border" />
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                            >
                              Esci
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="hidden sm:inline-flex btn-secondary text-sm px-4 py-2"
                  >
                    Accedi
                  </Link>
                  <Link
                    href="/auth/registrati"
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Registrati
                  </Link>
                </>
              )}
            </>
          )}

          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-surface-muted transition-colors"
            aria-label="Menu mobile"
          >
            <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-border bg-surface animate-slide-up">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-ink hover:bg-surface-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/proposte/nuova"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50"
                >
                  + Pubblica proposta
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Esci
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-surface-muted"
                >
                  Accedi
                </Link>
                <Link
                  href="/auth/registrati"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50"
                >
                  Registrati
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

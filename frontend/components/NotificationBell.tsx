'use client';
// components/NotificationBell.tsx
// Campanella notifiche con badge counter, dropdown e mark-as-read.
// Usa il client API autenticato e effettua polling ogni 60 secondi.

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Notification } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { notifications } = await api.notifications.list();
      setNotifications(notifications ?? []);
    } catch {
      // Silenzioso — non mostrare errori per il polling delle notifiche
    }
  }, [user]);

  // Carica al mount e poi ogni 60 secondi (polling leggero)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Chiudi dropdown al click fuori
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function markRead(id: string) {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch { /* ignora */ }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read_at);
    await Promise.allSettled(unread.map((n) => api.notifications.markRead(n.id)));
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
    );
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-surface-muted transition-colors"
        aria-label={`Notifiche${unreadCount > 0 ? ` (${unreadCount} non lette)` : ''}`}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center
                           rounded-full bg-brand-500 text-white text-[10px] font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface rounded-card border border-surface-border
                        shadow-card-hover z-40 animate-slide-up overflow-hidden">
          <div className="p-3 border-b border-surface-border flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Notifiche</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Segna tutte come lette
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <p className="p-6 text-sm text-ink-muted text-center">Nessuna notifica.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-surface-border last:border-0
                              hover:bg-surface-muted transition-colors ${!n.read_at ? 'bg-brand-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                    )}
                    <div className={!n.read_at ? '' : 'pl-3.5'}>
                      <p className="text-sm font-medium text-ink leading-snug">{n.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-ink-muted mt-1">
                        {new Date(n.created_at).toLocaleDateString('it-IT', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="20" height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="text-ink"
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

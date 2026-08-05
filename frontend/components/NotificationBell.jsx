// components/NotificationBell.jsx
'use client';
import { useEffect, useState } from 'react';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function markRead(id) {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-surface-muted transition-colors"
        aria-label="Notifiche"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-semibold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface rounded-card border border-surface-border shadow-lg z-40">
          <div className="p-3 border-b border-surface-border">
            <p className="text-sm font-semibold text-ink">Notifiche</p>
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted text-center">Nessuna notifica.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left p-3 border-b border-surface-border last:border-0 hover:bg-surface-muted transition-colors ${
                  !n.read_at ? 'bg-brand-50/40' : ''
                }`}
              >
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="text-xs text-ink-muted mt-0.5">{n.body}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

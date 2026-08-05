// frontend/lib/api.ts
// Client API centralizzato. Tutte le fetch passano da qui per aggiungere
// automaticamente l'header Authorization con il JWT salvato in localStorage.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : '/api';

type FetchOptions = RequestInit & {
  noAuth?: boolean;
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pw_token');
}

async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { noAuth = false, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };

  // Aggiungi Authorization header se c'è un token e la route non è pubblica
  if (!noAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Non impostare Content-Type se stiamo inviando FormData
  if (!(rest.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  // 204 No Content — risposta vuota
  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Errore ${res.status}`);
  }

  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body: { email: string; password: string; full_name: string; headline?: string }) =>
      apiFetch<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
        noAuth: true,
      }),

    login: (body: { email: string; password: string }) =>
      apiFetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        noAuth: true,
      }),

    me: () => apiFetch<{ user: User }>('/auth/me'),
  },

  // ─── Proposals ──────────────────────────────────────────────────────────────
  proposals: {
    list: (params?: { q?: string; category?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set('q', params.q);
      if (params?.category) qs.set('category', params.category);
      if (params?.page) qs.set('page', String(params.page));
      return apiFetch<{ proposals: Proposal[]; total: number }>(`/proposals?${qs}`);
    },

    get: (slug: string) =>
      apiFetch<{ proposal: Proposal; myApplication: Application | null }>(`/proposals/${slug}`),

    mine: () => apiFetch<{ proposals: Proposal[] }>('/proposals/mine/created'),

    create: (formData: FormData) =>
      apiFetch<{ proposal: Proposal }>('/proposals', { method: 'POST', body: formData }),

    close: (id: string) =>
      apiFetch<{ proposal: Proposal }>(`/proposals/${id}/close`, { method: 'PATCH' }),
  },

  // ─── Applications ────────────────────────────────────────────────────────────
  applications: {
    submit: (proposalId: string, message?: string) =>
      apiFetch<{ application: Application }>(`/proposals/${proposalId}/applications`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),

    myApplications: () =>
      apiFetch<{ applications: ApplicationWithProposal[] }>('/me/applications'),

    forProposal: (proposalId: string) =>
      apiFetch<{ applications: ApplicationWithApplicant[] }>(`/proposals/${proposalId}/applications`),

    accept: (applicationId: string) =>
      apiFetch(`/applications/${applicationId}/accept`, { method: 'PATCH' }),

    reject: (applicationId: string) =>
      apiFetch(`/applications/${applicationId}/reject`, { method: 'PATCH' }),
  },

  // ─── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    list: (unreadOnly = false) =>
      apiFetch<{ notifications: Notification[] }>(
        `/notifications${unreadOnly ? '?unread=true' : ''}`
      ),

    markRead: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  },
};

// ─── Tipi ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Proposal {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  summary?: string;
  description: string;
  category?: string;
  positions_available: number;
  pdf_url: string;
  pdf_filename: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
  // Join fields
  creator_name?: string;
  creator_avatar?: string;
  creator_headline?: string;
  pending_applications?: number;
  pending_count?: number;
  accepted_count?: number;
}

export interface Application {
  id: string;
  proposal_id: string;
  applicant_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled_auto';
  decided_at?: string;
  decision_reason?: string;
  created_at: string;
}

export interface ApplicationWithProposal extends Application {
  proposal_title: string;
  proposal_slug: string;
}

export interface ApplicationWithApplicant extends Application {
  applicant_id: string;
  full_name: string;
  headline?: string;
  avatar_url?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  related_proposal_id?: string;
  related_application_id?: string;
  read_at?: string;
  created_at: string;
}

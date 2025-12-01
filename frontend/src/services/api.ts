import { Release, ReleasesData } from '../types/releases';
import { UserProfile } from '../types/user';
import { OrganizationSummary, PendingProjectInvite, ProjectActivityMap, ProjectActivitySummary } from '../types/projects';
import { TransactionEventInput, TransactionEventsByClient } from '../types/transactions';

const DEFAULT_API_URL = 'http://localhost:3000';
const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? DEFAULT_API_URL;

interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface InviteDetails {
  email: string;
  projectName: string;
  client: string;
  inviterEmail: string;
  expiresAt: string;
}

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const buildErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const message = (payload as { message?: unknown }).message;
  if (!message) {
    return fallback;
  }

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return String(message);
};

const request = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${sanitizedPath}`;
  const headers = new Headers(options.headers ?? {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(payload, response.statusText || 'Request failed'));
  }

  return payload as T;
};

export const signupRequest = (payload: SignupPayload) =>
  request<AuthResponse>(
    '/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    undefined
  );

export const loginRequest = (email: string, password: string) =>
  request<AuthResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    undefined
  );

export const fetchReleases = (token: string) => request<ReleasesData>('/releases', { method: 'GET' }, token);

export const upsertRelease = (token: string, client: string, environment: string, release: Release) =>
  request<ReleasesData>(
    `/releases/${encodeURIComponent(client)}/${encodeURIComponent(environment)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        ...release,
        client,
        environment,
      }),
    },
    token
  );

export const deleteRelease = (token: string, client: string, environment: string) =>
  request<ReleasesData>(`/releases/${encodeURIComponent(client)}/${encodeURIComponent(environment)}`, { method: 'DELETE' }, token);

export const fetchTransactionEvents = (token: string) =>
  request<TransactionEventsByClient>('/transaction-events', { method: 'GET' }, token);

export const createTransactionEventRequest = (token: string, payload: TransactionEventInput) =>
  request<TransactionEventsByClient>(
    '/transaction-events',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );

export const updateTransactionEventRequest = (token: string, eventId: string, payload: TransactionEventInput) =>
  request<TransactionEventsByClient>(
    `/transaction-events/${encodeURIComponent(eventId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token
  );

export const sendProjectInvite = (token: string, client: string, email: string) =>
  request<void>(
    `/projects/${encodeURIComponent(client)}/invitations`,
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    token
  );

export const fetchPendingInvites = (token: string) =>
  request<PendingProjectInvite[]>('/projects/invitations', { method: 'GET' }, token);

export const acceptPendingInviteRequest = (token: string, inviteId: string) =>
  request<void>(`/projects/invitations/${encodeURIComponent(inviteId)}/accept`, { method: 'POST' }, token);

export const rejectPendingInviteRequest = (token: string, inviteId: string) =>
  request<void>(`/projects/invitations/${encodeURIComponent(inviteId)}/reject`, { method: 'POST' }, token);

export const fetchInviteDetails = (token: string) =>
  request<InviteDetails>(`/auth/invitations/${encodeURIComponent(token)}`, { method: 'GET' });

export const acceptInviteRequest = (tokenValue: string, password?: string) => {
  const payload: Record<string, string> = { token: tokenValue };

  if (password) {
    payload.password = password;
  }

  return request<AuthResponse>(
    '/auth/invitations/accept',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    undefined
  );
};

export const fetchCurrentUser = (token: string) => request<UserProfile>('/users/me', { method: 'GET' }, token);

export interface UpdateProfilePayload {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
}

export const updateProfileRequest = (token: string, payload: UpdateProfilePayload) =>
  request<UserProfile>(
    '/users/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token
  );

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const updatePasswordRequest = (token: string, payload: UpdatePasswordPayload) =>
  request<UserProfile>(
    '/users/me/password',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token
  );

export const fetchProjectActivitySummaries = (token: string) =>
  request<ProjectActivityMap>('/projects/activity', { method: 'GET' }, token);

export const fetchProjectActivityDetail = (token: string, client: string) =>
  request<ProjectActivitySummary>(`/projects/${encodeURIComponent(client)}/activity`, { method: 'GET' }, token);

export interface CreateOrganizationPayload {
  name: string;
  code: string;
}

export const fetchOrganizations = (token: string) =>
  request<OrganizationSummary[]>('/organizations', { method: 'GET' }, token);

export const createOrganizationRequest = (token: string, payload: CreateOrganizationPayload) =>
  request<OrganizationSummary>(
    '/organizations',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );

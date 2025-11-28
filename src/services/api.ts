import { Release, ReleasesData } from '../types/releases';

const DEFAULT_API_URL = 'http://localhost:3000';
const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? DEFAULT_API_URL;

interface AuthResponse {
  token: string;
  user: {
    email: string;
  };
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

export const signupRequest = (email: string, password: string) =>
  request<AuthResponse>(
    '/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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

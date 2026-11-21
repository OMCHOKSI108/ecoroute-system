import { TOKEN_KEY } from './constants';

function cleanBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

const BASE_URL = cleanBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1',
);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable
  }
}

export function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return 'An unexpected error occurred';
  const obj = body as Record<string, unknown>;
  // Try common error shapes
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.error === 'string') return obj.error;
  if (Array.isArray(obj.errors) && obj.errors.length > 0) {
    const first = obj.errors[0];
    if (typeof first === 'string') return first;
    if (typeof (first as Record<string, unknown>).message === 'string')
      return (first as Record<string, unknown>).message as string;
  }
  return `Request failed with status ${(obj as Record<string, unknown>).status ?? 'unknown'}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };

  // Only set Content-Type for json bodies (not for GET/DELETE without body)
  if (init?.body || init?.method === 'POST' || init?.method === 'PATCH' || init?.method === 'PUT') {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { ...init, headers });

  // Handle 401 — clear token only if an existing token was rejected on auth validation
  if (res.status === 401 && token && path.startsWith('/users/me')) {
    clearStoredToken();
  }

  // Handle empty responses (204 No Content, etc.)
  const contentLength = res.headers.get('content-length');
  if (res.status === 204 || contentLength === '0') {
    if (!res.ok) {
      throw new ApiError(res.status, res.statusText);
    }
    return undefined as unknown as T;
  }

  // Try to parse JSON
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(res.status, res.statusText);
    }
    return undefined as unknown as T;
  }

  if (!res.ok) {
    const message = extractErrorMessage(body);
    throw new ApiError(res.status, message, body);
  }

  if (
    body &&
    typeof body === 'object' &&
    'success' in (body as Record<string, unknown>) &&
    'data' in (body as Record<string, unknown>) &&
    Array.isArray((body as Record<string, unknown>).data)
  ) {
    return (body as { data: T }).data;
  }

  return body as T;
}

/**
 * Normalise responses that may be `{ success: true, data: [...] }` or `[...]` directly.
 * This lets hooks work with both `api.get<Pickup[]>` and `api.get<{ data: Pickup[] }>`.
 */
export function extractData<T>(response: T | { success: boolean; data: T }): T {
  if (
    response &&
    typeof response === 'object' &&
    'success' in (response as Record<string, unknown>) &&
    'data' in (response as Record<string, unknown>)
  ) {
    return (response as { success: boolean; data: T }).data;
  }
  return response as T;
}

// ── Public helpers ──────────────────────────────────────────────────────────

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

// Legacy helper for backward compat
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

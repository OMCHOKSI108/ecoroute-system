import { TOKEN_KEY } from './constants';
import type { User } from './types';

// ── Token management ────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable
  }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Extract an access token from various backend response shapes.
 * Backend may return:
 *   { token: "..." }
 *   { accessToken: "..." }
 *   { data: { accessToken: "..." } }
 *   { data: { token: "..." } }
 */
export function extractToken(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const obj = response as Record<string, unknown>;

  // Direct token field
  if (typeof obj.token === 'string') return obj.token;
  if (typeof obj.accessToken === 'string') return obj.accessToken;

  // Nested under tokens
  if (obj.tokens && typeof obj.tokens === 'object') {
    const tokens = obj.tokens as Record<string, unknown>;
    if (typeof tokens.accessToken === 'string') return tokens.accessToken;
    if (typeof tokens.token === 'string') return tokens.token;
  }

  // Nested under data
  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (typeof data.accessToken === 'string') return data.accessToken;
    if (typeof data.token === 'string') return data.token;
    if (data.tokens && typeof data.tokens === 'object') {
      const tokens = data.tokens as Record<string, unknown>;
      if (typeof tokens.accessToken === 'string') return tokens.accessToken;
      if (typeof tokens.token === 'string') return tokens.token;
    }
  }

  return null;
}

/**
 * Parse a User from various backend user shapes.
 * Backend may return user as { id, email, name, role, organizationId }
 * or as { id, email, firstName, lastName, role, organizationId } etc.
 */
function parseUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, any>;

  const id = obj.id || obj._id;
  if (!id) return null;

  return {
    id,
    email: obj.email || '',
    name: obj.name || `${obj.firstName ?? ''} ${obj.lastName ?? ''}`.trim() || 'Unknown',
    firstName: obj.firstName || obj.first_name,
    lastName: obj.lastName || obj.last_name,
    role: (obj.role as User['role']) || 'dispatcher',
    organizationId: obj.organizationId || obj.organization_id || '',
    businessId: obj.businessId || obj.business_id || null,
    businessName: obj.businessName || obj.business_name || null,
    phone: obj.phone || null,
    driverStatus: obj.driverStatus || obj.driver_status || null,
    isActive: obj.isActive !== undefined ? Boolean(obj.isActive) : (obj.is_active !== undefined ? Boolean(obj.is_active) : true),
    createdAt: obj.createdAt || obj.created_at,
  };
}

/**
 * Extract a User from various login/me response shapes.
 */
export function extractUser(response: unknown): User | null {
  if (!response || typeof response !== 'object') return null;
  const obj = response as Record<string, unknown>;

  // Direct user field
  if (obj.user && typeof obj.user === 'object') {
    const parsed = parseUser(obj.user);
    if (parsed) return parsed;
  }

  // Top-level user fields
  const parsed = parseUser(obj);
  if (parsed) return parsed;

  // Nested under data
  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (data.user && typeof data.user === 'object') {
      const parsed = parseUser(data.user);
      if (parsed) return parsed;
    }
    const parsed = parseUser(data);
    if (parsed) return parsed;
  }

  return null;
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { setToken, clearToken, getToken, extractToken, extractUser } from '@/lib/auth';
import type { User } from '@/lib/types';
import { ROUTES } from '@/lib/routes';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<Record<string, unknown>>('/auth/login', { email, password });
      const token = extractToken(res);
      if (!token) {
        setError('Login succeeded but no token returned');
        return null;
      }
      setToken(token);

      const parsed = extractUser(res);
      if (parsed) {
        setUser(parsed);
        return parsed;
      }

      // Try fetching current user if not in login response
      try {
        const meRes = await apiGet<Record<string, unknown>>('/users/me');
        const me = extractUser(meRes);
        if (me) setUser(me);
        return me;
      } catch {
        // users/me may not exist; proceed with login data
        return parsed;
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Please check your credentials.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Attempt backend logout — do not fail if it errors
      const token = getToken();
      if (token) {
        await apiPost('/auth/logout').catch(() => {});
      }
    } finally {
      clearToken();
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }

    setLoading(true);
    try {
      const res = await apiGet<Record<string, unknown>>('/users/me');
      const parsed = extractUser(res);
      if (parsed) {
        setUser(parsed);
        return parsed;
      }
      // If token exists but we can't get user, token might be invalid
      clearToken();
      setUser(null);
      return null;
    } catch {
      // If backend is offline or endpoint doesn't exist, keep token but no user
      // Don't clear token — user might still be valid
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-check on mount
  useEffect(() => {
    if (getToken()) {
      getCurrentUser();
    }
  }, [getCurrentUser]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    getCurrentUser,
    isAuthenticated: !!user || !!getToken(),
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Pickup } from '@/lib/types';

export function usePickups(status?: string) {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    api.get<Pickup[]>(`/pickups${query}`)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          return api.get<Pickup[]>('/pickups/my');
        }
        throw err;
      })
      .then((data) => {
        if (!cancelled) {
          setPickups(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load pickups');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [status, reloadKey]);

  return { pickups, loading, error, reload };
}

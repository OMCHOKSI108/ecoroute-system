'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Business } from '@/lib/types';

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('ecoroute_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    api.get<Business[]>('/businesses')
      .then((data) => {
        if (!cancelled) setBusinesses(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : 'Failed to load businesses');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { businesses, loading, error };
}

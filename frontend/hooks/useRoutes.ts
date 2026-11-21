'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Route } from '@/lib/types';

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<Route[]>('/routes')
      .then((data) => { if (!cancelled) setRoutes(data); })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : 'Failed to load routes');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { routes, loading, error };
}

'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Driver } from '@/lib/types';

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<Driver[]>('/drivers')
      .then((data) => { if (!cancelled) setDrivers(data); })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : 'Failed to load drivers');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { drivers, loading, error };
}

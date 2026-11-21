'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<DashboardStats>('/dashboard/summary')
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : 'Failed to load stats');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}

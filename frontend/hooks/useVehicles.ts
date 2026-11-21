'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Vehicle } from '@/lib/types';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<Vehicle[]>('/vehicles')
      .then((data) => { if (!cancelled) setVehicles(data); })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : 'Failed to load vehicles');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { vehicles, loading, error };
}

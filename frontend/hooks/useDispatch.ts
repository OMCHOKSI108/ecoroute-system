'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Pickup, Driver, Vehicle } from '@/lib/types';

export function useDispatch() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
    Promise.all([
      api.get<Pickup[]>('/pickups?status=pending'),
      api.get<Driver[]>('/drivers?status=available'),
      api.get<Vehicle[]>('/vehicles?status=available'),
    ])
      .then(([p, d, v]) => {
        if (!cancelled) {
          setPickups(p);
          setDrivers(d);
          setVehicles(v);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load dispatch data');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return { pickups, drivers, vehicles, loading, error, reload };
}

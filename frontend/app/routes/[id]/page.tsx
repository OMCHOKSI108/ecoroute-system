'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { api, ApiError } from '@/lib/api';

interface RouteDetail {
  id: string;
  status: string;
  vehicleId: string;
  totalDistanceM: number;
  totalDurationS: number;
  pickupCount: number;
  createdAt: string;
}

interface RouteStop {
  id: string;
  routeId: string;
  pickupId: string | null;
  stopOrder: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export default function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const routeId = resolvedParams.id;
  const router = useRouter();

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadRouteData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rData, sData] = await Promise.all([
        api.get<RouteDetail>(`/routes/${routeId}`),
        api.get<RouteStop[]>(`/route-stops/by-route/${routeId}`),
      ]);
      setRoute(rData);
      setStops(Array.isArray(sData) ? sData : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load route details');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    loadRouteData();
  }, [loadRouteData]);

  const handleUpdateStopStatus = async (stopId: string, status: string) => {
    setActionLoading(stopId);
    try {
      await api.patch(`/route-stops/${stopId}/status`, { status });
      setActionSuccess(`Stop #${stops.find((s) => s.id === stopId)?.stopOrder} updated to "${status}"`);
      await loadRouteData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update stop status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompletePickup = async (pickupId: string) => {
    setActionLoading(pickupId);
    try {
      await api.patch(`/pickups/${pickupId}/status`, { status: 'completed' });
      setActionSuccess(`Pickup marked as completed!`);
      await loadRouteData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete pickup');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteRoute = async () => {
    setActionLoading('route-complete');
    try {
      await api.patch(`/routes/${routeId}/status`, { status: 'completed' });
      setActionSuccess(`Route completed! Vehicle capacity reset to available.`);
      await loadRouteData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete route');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <ProtectedAppPage>
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Route — ${routeId.slice(0, 8)}`}
          description="Real-time route navigation, waypoints, and collection progress"
        />
        {route?.status === 'active' && (
          <Button
            variant="primary"
            onClick={handleCompleteRoute}
            loading={actionLoading === 'route-complete'}
            data-testid="complete-route-button"
          >
            Mark Route Completed
          </Button>
        )}
      </div>

      {loading && <LoadingState message="Loading route details…" />}
      {error && <ErrorState message={error} onRetry={loadRouteData} />}

      {actionSuccess && (
        <div
          className="my-4 rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-sm font-medium text-emerald-800"
          data-testid="route-action-success"
        >
          {actionSuccess}
        </div>
      )}

      {route && (
        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500">Route Status</span>
              <div className="mt-1" data-testid="route-status-badge">
                <StatusBadge status={route.status} />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500">Total Distance</span>
              <p className="mt-1 text-lg font-bold text-gray-900" data-testid="route-distance">
                {((route.totalDistanceM ?? 0) / 1000).toFixed(1)} km
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500">Est. Duration</span>
              <p className="mt-1 text-lg font-bold text-gray-900" data-testid="route-duration">
                {Math.round((route.totalDurationS ?? 0) / 60)} mins
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-gray-500">Stops</span>
              <p className="mt-1 text-lg font-bold text-gray-900" data-testid="route-pickup-count">
                {route.pickupCount ?? stops.length}
              </p>
            </div>
          </div>

          {/* Ordered Stops Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden" data-testid="route-stops-container">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900">Ordered Collection Stops</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Stop #</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Coordinates</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Pickup ID</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Driver Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {stops.map((s) => (
                    <tr key={s.id} data-testid={`route-stop-row-${s.id}`}>
                      <td className="px-6 py-4 font-bold text-emerald-600" data-testid={`stop-order-${s.id}`}>
                        Stop {s.stopOrder}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
                      </td>
                      <td className="px-6 py-4" data-testid={`stop-status-${s.id}`}>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {s.pickupId ? s.pickupId.slice(0, 8) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {s.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStopStatus(s.id, 'arrived')}
                            loading={actionLoading === s.id}
                            data-testid={`mark-arrived-button-${s.id}`}
                          >
                            Mark Arrived
                          </Button>
                        )}
                        {s.status === 'arrived' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateStopStatus(s.id, 'completed')}
                            loading={actionLoading === s.id}
                            data-testid={`mark-completed-button-${s.id}`}
                          >
                            Mark Completed
                          </Button>
                        )}
                        {s.pickupId && s.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompletePickup(s.pickupId!)}
                            loading={actionLoading === s.pickupId}
                            data-testid={`complete-pickup-button-${s.pickupId}`}
                          >
                            Complete Pickup
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </ProtectedAppPage>
  );
}

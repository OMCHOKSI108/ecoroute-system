'use client';

import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { useRoutes } from '@/hooks/useRoutes';

export default function LiveTrackingPage() {
  const { routes, loading } = useRoutes();
  const activeRoutes = routes.filter((r) => r.status === 'active');

  return (
    <ProtectedAppPage>
      <PageHeader
        title="Live Tracking"
        description="Real-time vehicle and route positions"
      />
      <div className="space-y-4">
        <MapPlaceholder height="450px" />
        {loading ? (
          <LoadingState message="Loading routes…" />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-gray-900">
              Active Routes ({activeRoutes.length})
            </h3>
            {activeRoutes.length === 0 ? (
              <p className="text-sm text-gray-500">No active routes</p>
            ) : (
              <ul className="space-y-2">
                {activeRoutes.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-gray-500">{r.id.slice(0, 8)}</span>
                    <StatusBadge status={r.status} />
                    <span className="text-gray-500">{r.distance.toFixed(1)} km</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </ProtectedAppPage>
  );
}

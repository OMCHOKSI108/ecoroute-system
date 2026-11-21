'use client';

import { useDispatch } from '@/hooks/useDispatch';
import { AvailableDriversPanel } from './AvailableDriversPanel';
import { AvailableVehiclesPanel } from './AvailableVehiclesPanel';
import { UnassignedPickupsPanel } from './UnassignedPickupsPanel';
import { DispatchPreviewPanel } from './DispatchPreviewPanel';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export function DispatchBoard() {
  const { pickups, drivers, vehicles, loading, error, reload } = useDispatch();

  if (loading) return <LoadingState message="Loading dispatch data…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <MapPlaceholder height="300px" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <UnassignedPickupsPanel pickups={pickups} />
        <div className="space-y-4">
          <AvailableDriversPanel drivers={drivers} />
          <AvailableVehiclesPanel vehicles={vehicles} />
        </div>
        <DispatchPreviewPanel />
      </div>
    </div>
  );
}

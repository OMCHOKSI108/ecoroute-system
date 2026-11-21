'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { usePickups } from '@/hooks/usePickups';
import { useVehicles } from '@/hooks/useVehicles';
import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStats';
import { RecentPickupsTable } from '@/components/dashboard/RecentPickupsTable';
import { VehicleWorkloadTable } from '@/components/dashboard/VehicleWorkloadTable';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function DashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useDashboard();
  const { pickups } = usePickups();
  const { vehicles } = useVehicles();

  if (statsLoading) {
    return (
      <ProtectedAppPage>
        <PageHeader title="Dashboard" description="Fleet overview and real-time metrics" />
        <LoadingState message="Loading stats…" />
      </ProtectedAppPage>
    );
  }

  if (statsError) {
    return (
      <ProtectedAppPage>
        <PageHeader title="Dashboard" description="Fleet overview and real-time metrics" />
        <ErrorState message={statsError} />
      </ProtectedAppPage>
    );
  }

  return (
    <ProtectedAppPage>
      <PageHeader
        title="Dashboard"
        description="Fleet overview and real-time metrics"
      />
      <div className="space-y-6">
        <DashboardStatsGrid stats={stats!} />
        <MapPlaceholder height="240px" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-base font-semibold text-gray-900">Recent Pickups</h2>
            <RecentPickupsTable pickups={pickups.slice(0, 5)} />
          </div>
          <div>
            <h2 className="mb-3 text-base font-semibold text-gray-900">Vehicle Workload</h2>
            <VehicleWorkloadTable vehicles={vehicles.slice(0, 5)} />
          </div>
        </div>
      </div>
    </ProtectedAppPage>
  );
}

'use client';

import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { DriverTable } from '@/components/drivers/DriverTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDrivers } from '@/hooks/useDrivers';

export default function DriversPage() {
  const { drivers, loading, error } = useDrivers();

  return (
    <ProtectedAppPage>
      <PageHeader title="Drivers" description="Manage fleet drivers" />
      {loading && <LoadingState message="Loading drivers…" />}
      {error && <ErrorState message={error} />}
      {!loading && !error && drivers.length === 0 && (
        <EmptyState title="No drivers" description="Drivers will appear here once added." />
      )}
      {!loading && !error && drivers.length > 0 && <DriverTable drivers={drivers} />}
    </ProtectedAppPage>
  );
}

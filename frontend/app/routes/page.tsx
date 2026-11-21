'use client';

import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { RouteTable } from '@/components/routes/RouteTable';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRoutes } from '@/hooks/useRoutes';

export default function RoutesPage() {
  const { routes, loading, error } = useRoutes();

  return (
    <ProtectedAppPage>
      <PageHeader title="Routes" description="View and manage dispatch routes" />
      {loading && <LoadingState message="Loading routes…" />}
      {error && <ErrorState message={error} />}
      {!loading && !error && routes.length === 0 && (
        <EmptyState title="No routes" description="Routes will appear here once generated." />
      )}
      {!loading && !error && routes.length > 0 && <RouteTable routes={routes} />}
    </ProtectedAppPage>
  );
}

import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';

export default function PickupLocationsPage() {
  return (
    <ProtectedAppPage>
      <PageHeader title="Pickup Locations" />
      <p className="mt-1 text-sm text-gray-500">Manage pickup locations</p>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </ProtectedAppPage>
  );
}

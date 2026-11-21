import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';

export default function OrganizationsPage() {
  return (
    <ProtectedAppPage>
      <PageHeader title="Organizations" />
      <p className="mt-1 text-sm text-gray-500">Manage organizations</p>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </ProtectedAppPage>
  );
}

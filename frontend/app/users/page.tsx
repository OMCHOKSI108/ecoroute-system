import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';

export default function UsersPage() {
  return (
    <ProtectedAppPage>
      <PageHeader title="Users" />
      <p className="mt-1 text-sm text-gray-500">Manage system users</p>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </ProtectedAppPage>
  );
}

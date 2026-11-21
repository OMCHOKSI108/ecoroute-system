import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NotificationsPage() {
  return (
    <ProtectedAppPage>
      <PageHeader title="Notifications" />
      <p className="mt-1 text-sm text-gray-500">View system notifications</p>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </ProtectedAppPage>
  );
}

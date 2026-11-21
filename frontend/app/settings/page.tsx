import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';

export default function SettingsPage() {
  return (
    <ProtectedAppPage>
      <PageHeader title="Settings" />
      <p className="mt-1 text-sm text-gray-500">Configure system settings</p>
      <p className="text-sm text-gray-500">Coming soon.</p>
    </ProtectedAppPage>
  );
}

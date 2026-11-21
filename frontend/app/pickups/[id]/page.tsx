import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function PickupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedAppPage>
      <PageHeader title={`Pickup — ${id.slice(0, 8)}`} />
      <p className="text-sm text-gray-500">Pickup detail view coming soon.</p>
    </ProtectedAppPage>
  );
}

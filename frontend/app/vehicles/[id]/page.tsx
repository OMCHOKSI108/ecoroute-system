import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedAppPage>
      <PageHeader title={`Vehicle — ${id.slice(0, 8)}`} />
      <p className="text-sm text-gray-500">Vehicle detail view coming soon.</p>
    </ProtectedAppPage>
  );
}

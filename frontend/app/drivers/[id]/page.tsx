import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProtectedAppPage>
      <PageHeader title={`Driver — ${id.slice(0, 8)}`} />
      <p className="text-sm text-gray-500">Driver detail view coming soon.</p>
    </ProtectedAppPage>
  );
}

import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Driver } from '@/lib/types';

interface DriverTableProps {
  drivers: Driver[];
}

export function DriverTable({ drivers }: DriverTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {drivers.map((d) => (
            <tr key={d.id}>
              <td className="px-4 py-3 font-medium">{d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email}</td>
              <td className="px-4 py-3 text-gray-500">{d.email}</td>
              <td className="px-4 py-3 text-gray-500">{d.phone || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={d.status || d.driverStatus || 'available'} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

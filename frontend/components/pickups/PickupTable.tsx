import { PickupStatusBadge } from './PickupStatusBadge';
import { formatDateTime } from '@/lib/utils';
import type { Pickup } from '@/lib/types';

interface PickupTableProps {
  pickups: Pickup[];
}

export function PickupTable({ pickups }: PickupTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Weight</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Scheduled</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {pickups.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}</td>
              <td className="px-4 py-3">{p.wasteCategory}</td>
              <td className="px-4 py-3">{p.weightKg} kg</td>
              <td className="px-4 py-3"><PickupStatusBadge status={p.status} /></td>
              <td className="px-4 py-3 text-gray-500">{formatDateTime(p.scheduledAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

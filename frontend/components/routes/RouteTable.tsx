import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/utils';
import type { Route } from '@/lib/types';

interface RouteTableProps {
  routes: Route[];
}

export function RouteTable({ routes }: RouteTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Distance</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {routes.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.id.slice(0, 8)}</td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3">{((r as any).totalDistanceM ? (r as any).totalDistanceM / 1000 : r.distance ?? 0).toFixed(1)} km</td>
              <td className="px-4 py-3 text-gray-500">{formatDateTime(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

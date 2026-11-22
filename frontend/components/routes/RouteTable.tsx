import Link from 'next/link';
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
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Route ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Distance</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {routes.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
              <td className="px-4 py-3 font-mono text-xs font-semibold">
                <Link href={`/routes/${r.id}`} className="text-emerald-600 hover:underline">
                  {r.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3">{((r as any).totalDistanceM ? (r as any).totalDistanceM / 1000 : r.distance ?? 0).toFixed(1)} km</td>
              <td className="px-4 py-3 text-gray-500">{formatDateTime(r.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/routes/${r.id}`}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50"
                  data-testid={`view-route-${r.id}`}
                >
                  View Route
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

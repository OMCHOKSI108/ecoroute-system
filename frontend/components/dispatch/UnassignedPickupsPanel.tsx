import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Pickup } from '@/lib/types';

interface UnassignedPickupsPanelProps {
  pickups: Pickup[];
}

export function UnassignedPickupsPanel({ pickups }: UnassignedPickupsPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-gray-900">
        Unassigned Pickups ({pickups.length})
      </h3>
      {pickups.length === 0 ? (
        <p className="text-sm text-gray-500">No unassigned pickups.</p>
      ) : (
        <ul className="space-y-2">
          {pickups.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
            >
              <div>
                <span className="text-sm font-medium">{p.wasteCategory}</span>
                <span className="ml-2 text-xs text-gray-500">{p.weightKg} kg</span>
              </div>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

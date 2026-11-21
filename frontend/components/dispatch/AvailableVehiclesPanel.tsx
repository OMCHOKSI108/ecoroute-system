import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Vehicle } from '@/lib/types';

interface AvailableVehiclesPanelProps {
  vehicles: Vehicle[];
}

export function AvailableVehiclesPanel({ vehicles }: AvailableVehiclesPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-gray-900">
        Available Vehicles ({vehicles.length})
      </h3>
      {vehicles.length === 0 ? (
        <p className="text-sm text-gray-500">No vehicles available.</p>
      ) : (
        <ul className="space-y-2">
          {vehicles.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
            >
              <div>
                <span className="text-sm font-medium">{v.plateNumber}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {v.currentLoadKg}/{v.capacityKg} kg
                </span>
              </div>
              <StatusBadge status={v.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

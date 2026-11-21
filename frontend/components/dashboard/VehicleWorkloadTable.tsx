import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Vehicle } from '@/lib/types';

interface VehicleWorkloadTableProps {
  vehicles: Vehicle[];
}

export function VehicleWorkloadTable({ vehicles }: VehicleWorkloadTableProps) {
  if (vehicles.length === 0) {
    return <p className="text-sm text-gray-500">No vehicles to display.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Plate</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Load</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td className="px-4 py-3 font-medium">{v.plateNumber}</td>
              <td className="px-4 py-3">{v.type}</td>
              <td className="px-4 py-3 text-gray-500">{v.currentLoadKg}/{v.capacityKg} kg</td>
              <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

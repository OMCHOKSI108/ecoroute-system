import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Driver } from '@/lib/types';

interface AvailableDriversPanelProps {
  drivers: Driver[];
}

export function AvailableDriversPanel({ drivers }: AvailableDriversPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-gray-900">
        Available Drivers ({drivers.length})
      </h3>
      {drivers.length === 0 ? (
        <p className="text-sm text-gray-500">No drivers available.</p>
      ) : (
        <ul className="space-y-2">
          {drivers.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
            >
              <span className="text-sm font-medium">
                {d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email}
              </span>
              <StatusBadge status={d.status || d.driverStatus || 'available'} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

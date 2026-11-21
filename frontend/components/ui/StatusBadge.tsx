interface StatusBadgeProps {
  status: string;
}

const colorMap: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  available: 'bg-emerald-100 text-emerald-800',
  on_route: 'bg-blue-100 text-blue-800',
  off_duty: 'bg-gray-100 text-gray-800',
  in_use: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-orange-100 text-orange-800',
  active: 'bg-indigo-100 text-indigo-800',
  planned: 'bg-yellow-100 text-yellow-800',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = colorMap[status] ?? 'bg-gray-100 text-gray-800';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

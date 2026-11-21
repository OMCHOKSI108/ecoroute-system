import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Pickup } from '@/lib/types';

interface PickupStatusBadgeProps {
  status: Pickup['status'];
}

export function PickupStatusBadge({ status }: PickupStatusBadgeProps) {
  return <StatusBadge status={status} />;
}

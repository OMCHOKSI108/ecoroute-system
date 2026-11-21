import { StatCard } from '@/components/ui/StatCard';
import type { DashboardStats } from '@/lib/types';

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="Active Routes" value={stats.activeRoutes} />
      <StatCard label="Pending Pickups" value={stats.pendingPickups} />
      <StatCard label="Available Vehicles" value={stats.availableVehicles} />
      <StatCard label="Completed Today" value={stats.completedToday} />
    </div>
  );
}

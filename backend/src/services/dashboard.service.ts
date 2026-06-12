import * as dashRepo from '../repositories/dashboard.repository';

export async function getDashboardSummary(orgId: string) {
  const [fleet, pickups, routes] = await Promise.all([
    dashRepo.getFleetSummary(orgId),
    dashRepo.getPickupSummary(orgId),
    dashRepo.getRouteSummary(orgId),
  ]);
  return { fleet, pickups, routes };
}

export async function getVehicleWorkloads(orgId: string) {
  const rows = await dashRepo.getVehicleWorkloads(orgId);
  return rows.map((v) => ({
    vehicleId: v.vehicle_id,
    plateNumber: v.plate_number,
    model: v.model,
    status: v.status,
    capacityKg: parseFloat(v.capacity_kg),
    currentLoadKg: parseFloat(v.current_load_kg),
    utilizationPct: parseFloat(v.capacity_kg) > 0
      ? Math.round((parseFloat(v.current_load_kg) / parseFloat(v.capacity_kg)) * 100)
      : 0,
    assignedPickupCount: v.assigned_pickup_count,
  }));
}

export async function getPickupStats(orgId: string) {
  const [byStatus, byCategory, today] = await Promise.all([
    dashRepo.getPickupStatsByStatus(orgId),
    dashRepo.getPickupStatsByCategory(orgId),
    dashRepo.getTodayPickupStats(orgId),
  ]);
  const statusMap = Object.fromEntries(byStatus.map((r) => [r.status, r.count]));
  return { byStatus: statusMap, byCategory, today };
}

export async function getTrends(orgId: string) {
  const weekly = await dashRepo.getWeeklyTrends(orgId);
  return { weekly };
}

export async function getDriverActivity(orgId: string) {
  return dashRepo.getDriverActivity(orgId);
}

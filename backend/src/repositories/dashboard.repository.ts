import { query } from '../config/db';

export interface FleetSummary {
  total: number;
  available: number;
  dispatched: number;
  maintenance: number;
  offline: number;
}

export interface PickupSummary {
  pending: number;
  assigned: number;
  in_progress: number;
  completed_today: number;
  cancelled_today: number;
}

export interface RouteSummary {
  active: number;
  completed_today: number;
}

export interface VehicleWorkload {
  vehicle_id: string;
  plate_number: string;
  model: string;
  status: string;
  capacity_kg: string;
  current_load_kg: string;
  assigned_pickup_count: number;
}

export interface PickupStatsByStatus {
  status: string;
  count: number;
}

export interface PickupStatsByCategory {
  waste_category: string;
  count: number;
}

export async function getFleetSummary(orgId: string): Promise<FleetSummary> {
  const result = await query<{
    total: string;
    available: string;
    dispatched: string;
    maintenance: string;
    offline: string;
  }>(
    `SELECT
       COUNT(*)                                                  AS total,
       COUNT(*) FILTER (WHERE status = 'available')             AS available,
       COUNT(*) FILTER (WHERE status = 'dispatched')            AS dispatched,
       COUNT(*) FILTER (WHERE status = 'maintenance')           AS maintenance,
       COUNT(*) FILTER (WHERE status = 'offline')               AS offline
     FROM vehicles
     WHERE organization_id = $1`,
    [orgId],
  );
  const row = result.rows[0]!;
  return {
    total: parseInt(row.total, 10),
    available: parseInt(row.available, 10),
    dispatched: parseInt(row.dispatched, 10),
    maintenance: parseInt(row.maintenance, 10),
    offline: parseInt(row.offline, 10),
  };
}

export async function getPickupSummary(orgId: string): Promise<PickupSummary> {
  const result = await query<{
    pending: string;
    assigned: string;
    in_progress: string;
    completed_today: string;
    cancelled_today: string;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'pending')                                        AS pending,
       COUNT(*) FILTER (WHERE status = 'assigned')                                       AS assigned,
       COUNT(*) FILTER (WHERE status = 'in_progress')                                    AS in_progress,
       COUNT(*) FILTER (WHERE status = 'completed' AND updated_at >= CURRENT_DATE)       AS completed_today,
       COUNT(*) FILTER (WHERE status = 'cancelled' AND updated_at >= CURRENT_DATE)       AS cancelled_today
     FROM pickup_requests
     WHERE organization_id = $1`,
    [orgId],
  );
  const row = result.rows[0]!;
  return {
    pending: parseInt(row.pending, 10),
    assigned: parseInt(row.assigned, 10),
    in_progress: parseInt(row.in_progress, 10),
    completed_today: parseInt(row.completed_today, 10),
    cancelled_today: parseInt(row.cancelled_today, 10),
  };
}

export async function getRouteSummary(orgId: string): Promise<RouteSummary> {
  const result = await query<{ active: string; completed_today: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'active')                                         AS active,
       COUNT(*) FILTER (WHERE status = 'completed' AND updated_at >= CURRENT_DATE)       AS completed_today
     FROM routes
     WHERE organization_id = $1`,
    [orgId],
  );
  const row = result.rows[0]!;
  return {
    active: parseInt(row.active, 10),
    completed_today: parseInt(row.completed_today, 10),
  };
}

export async function getVehicleWorkloads(orgId: string): Promise<VehicleWorkload[]> {
  const result = await query<VehicleWorkload>(
    `SELECT
       v.id               AS vehicle_id,
       v.plate_number,
       v.model,
       v.status,
       v.capacity_kg,
       v.current_load_kg,
       COUNT(pr.id)::int  AS assigned_pickup_count
     FROM vehicles v
     LEFT JOIN pickup_requests pr
       ON pr.assigned_vehicle_id = v.id
      AND pr.status IN ('assigned', 'in_progress')
     WHERE v.organization_id = $1
     GROUP BY v.id, v.plate_number, v.model, v.status, v.capacity_kg, v.current_load_kg
     ORDER BY v.plate_number`,
    [orgId],
  );
  return result.rows;
}

export async function getPickupStatsByStatus(orgId: string): Promise<PickupStatsByStatus[]> {
  const result = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::int AS count
     FROM pickup_requests
     WHERE organization_id = $1
     GROUP BY status
     ORDER BY status`,
    [orgId],
  );
  return result.rows.map((r) => ({ status: r.status, count: parseInt(String(r.count), 10) }));
}

export async function getPickupStatsByCategory(orgId: string): Promise<PickupStatsByCategory[]> {
  const result = await query<{ waste_category: string; count: string }>(
    `SELECT waste_category, COUNT(*)::int AS count
     FROM pickup_requests
     WHERE organization_id = $1
     GROUP BY waste_category
     ORDER BY count DESC`,
    [orgId],
  );
  return result.rows.map((r) => ({ waste_category: r.waste_category, count: parseInt(String(r.count), 10) }));
}

export interface TodayStats {
  created: number;
  completed: number;
  cancelled: number;
}

export interface WeeklyTrend {
  date: string;
  created: number;
  completed: number;
}

export async function getWeeklyTrends(orgId: string): Promise<WeeklyTrend[]> {
  const result = await query<{ date: string; created: string; completed: string }>(
    `SELECT
       d::date AS date,
       COUNT(pr.id) FILTER (WHERE pr.created_at::date = d) AS created,
       COUNT(pr.id) FILTER (WHERE pr.status = 'completed' AND pr.updated_at::date = d) AS completed
     FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') d
     LEFT JOIN pickup_requests pr ON pr.organization_id = $1
       AND (pr.created_at::date = d OR (pr.status = 'completed' AND pr.updated_at::date = d))
     GROUP BY d
     ORDER BY d ASC`,
    [orgId],
  );
  return result.rows.map((r) => ({
    date: r.date,
    created: parseInt(r.created, 10),
    completed: parseInt(r.completed, 10),
  }));
}

export interface DriverActivity {
  userId: string;
  fullName: string;
  driverStatus: string | null;
  assignedPickups: number;
}

export async function getDriverActivity(orgId: string): Promise<DriverActivity[]> {
  const result = await query<{
    user_id: string;
    first_name: string;
    last_name: string;
    driver_status: string | null;
    assigned_pickups: string;
  }>(
    `SELECT
       u.id AS user_id,
       u.first_name,
       u.last_name,
       u.driver_status,
       COUNT(pr.id)::int AS assigned_pickups
     FROM users u
     LEFT JOIN pickup_requests pr ON pr.assigned_vehicle_id IN (
       SELECT id FROM vehicles WHERE driver_id = u.id
     ) AND pr.status IN ('assigned', 'in_progress')
     WHERE u.organization_id = $1 AND u.role = 'driver'
     GROUP BY u.id, u.first_name, u.last_name, u.driver_status
     ORDER BY u.last_name, u.first_name`,
    [orgId],
  );
  return result.rows.map((r) => ({
    userId: r.user_id,
    fullName: `${r.first_name} ${r.last_name}`,
    driverStatus: r.driver_status,
    assignedPickups: parseInt(String(r.assigned_pickups), 10),
  }));
}

export async function getTodayPickupStats(orgId: string): Promise<TodayStats> {
  const result = await query<{ created: string; completed: string; cancelled: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                                AS created,
       COUNT(*) FILTER (WHERE status = 'completed' AND updated_at >= CURRENT_DATE)       AS completed,
       COUNT(*) FILTER (WHERE status = 'cancelled' AND updated_at >= CURRENT_DATE)       AS cancelled
     FROM pickup_requests
     WHERE organization_id = $1`,
    [orgId],
  );
  const row = result.rows[0]!;
  return {
    created: parseInt(row.created, 10),
    completed: parseInt(row.completed, 10),
    cancelled: parseInt(row.cancelled, 10),
  };
}

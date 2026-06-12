import { PoolClient } from 'pg';
import { query } from '../config/db';

export interface RouteRow {
  id: string;
  organization_id: string;
  vehicle_id: string;
  status: 'active' | 'completed' | 'failed';
  total_distance_m: string;
  total_duration_s: string;
  geometry: unknown;
  waypoints: unknown;
  pickup_count: number;
  osrm_data: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface PickupWithLocation {
  id: string;
  lng: number;
  lat: number;
}

export interface CreateRouteData {
  organizationId: string;
  vehicleId: string;
  totalDistanceM: number;
  totalDurationS: number;
  geometry: unknown;
  waypoints: unknown;
  pickupCount: number;
  osrmData: unknown;
}

export interface FindRoutesFilters {
  vehicleId?: string;
  status?: string;
  page: number;
  limit: number;
}

export async function lockVehicleForRouteGeneration(
  client: PoolClient,
  vehicleId: string,
  orgId: string,
): Promise<{ id: string; status: string } | null> {
  const result = await client.query<{ id: string; status: string }>(
    `SELECT id, status
     FROM vehicles
     WHERE id = $1 AND organization_id = $2
     FOR UPDATE`,
    [vehicleId, orgId],
  );
  return result.rows[0] ?? null;
}

export async function findActiveRouteForVehicle(
  client: PoolClient,
  vehicleId: string,
  orgId: string,
): Promise<RouteRow | null> {
  const result = await client.query<RouteRow>(
    `SELECT *
     FROM routes
     WHERE vehicle_id = $1 AND organization_id = $2 AND status = 'active'
     FOR UPDATE`,
    [vehicleId, orgId],
  );
  return result.rows[0] ?? null;
}

export async function findAssignedPickupsWithLocations(
  vehicleId: string,
  orgId: string,
  client?: PoolClient,
): Promise<PickupWithLocation[]> {
  const queryFn = client
    ? client.query.bind(client)
    : query;
  const result = await queryFn<{ id: string; lng: number; lat: number }>(
    `SELECT pr.id,
            ST_X(b.location::geometry) AS lng,
            ST_Y(b.location::geometry) AS lat
     FROM pickup_requests pr
     JOIN businesses b ON b.id = pr.business_id
     WHERE pr.assigned_vehicle_id = $1
       AND pr.organization_id = $2
       AND pr.status = 'assigned'`,
    [vehicleId, orgId],
  );
  return result.rows;
}

export async function createRoute(client: PoolClient, data: CreateRouteData): Promise<RouteRow> {
  const result = await client.query<RouteRow>(
    `INSERT INTO routes
       (organization_id, vehicle_id, total_distance_m, total_duration_s,
        geometry, waypoints, pickup_count, osrm_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.organizationId,
      data.vehicleId,
      data.totalDistanceM,
      data.totalDurationS,
      JSON.stringify(data.geometry),
      JSON.stringify(data.waypoints),
      data.pickupCount,
      JSON.stringify(data.osrmData),
    ],
  );
  return result.rows[0]!;
}

export async function setPickupsRouteId(
  client: PoolClient,
  pickupIds: string[],
  routeId: string,
): Promise<number> {
  const result = await client.query(
    `UPDATE pickup_requests
     SET route_id = $1, status = 'in_progress', updated_at = NOW()
     WHERE id = ANY($2::uuid[])
       AND status = 'assigned'
       AND route_id IS NULL`,
    [routeId, pickupIds],
  );
  return result.rowCount ?? 0;
}

export async function findRouteByIdAndOrg(id: string, orgId: string): Promise<RouteRow | null> {
  const result = await query<RouteRow>(
    'SELECT * FROM routes WHERE id = $1 AND organization_id = $2',
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function lockRouteForUpdate(
  client: PoolClient,
  id: string,
  orgId: string,
): Promise<RouteRow | null> {
  const result = await client.query<RouteRow>(
    'SELECT * FROM routes WHERE id = $1 AND organization_id = $2 FOR UPDATE',
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function findRoutesByOrg(
  orgId: string,
  filters: FindRoutesFilters,
): Promise<{ data: RouteRow[]; total: number }> {
  const conditions: string[] = ['organization_id = $1'];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (filters.vehicleId) {
    conditions.push(`vehicle_id = $${idx++}`);
    params.push(filters.vehicleId);
  }
  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  }

  const where = conditions.join(' AND ');
  const offset = (filters.page - 1) * filters.limit;

  const [dataResult, countResult] = await Promise.all([
    query<RouteRow>(
      `SELECT * FROM routes WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, filters.limit, offset],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM routes WHERE ${where}`,
      params,
    ),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0]!.count, 10),
  };
}

export async function updateRouteStatus(
  client: PoolClient,
  id: string,
  orgId: string,
  status: string,
): Promise<RouteRow | null> {
  const result = await client.query<RouteRow>(
    `UPDATE routes SET status = $1, updated_at = NOW()
     WHERE id = $2 AND organization_id = $3
     RETURNING *`,
    [status, id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function completeVehicleAfterRoute(
  client: PoolClient,
  vehicleId: string,
  orgId: string,
): Promise<void> {
  await client.query(
    `UPDATE vehicles
     SET status = 'available', current_load_kg = 0, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2`,
    [vehicleId, orgId],
  );
}

export async function completePickupsForRoute(
  client: PoolClient,
  routeId: string,
): Promise<void> {
  await client.query(
    `UPDATE pickup_requests
     SET status = 'completed', updated_at = NOW()
     WHERE route_id = $1 AND status = 'in_progress'`,
    [routeId],
  );
}

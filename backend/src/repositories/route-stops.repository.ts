import { query } from '../config/db';

export interface RouteStopRow {
  id: string;
  route_id: string;
  pickup_id: string | null;
  stop_order: number;
  status: 'pending' | 'arrived' | 'completed' | 'skipped' | 'failed';
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  planned_distance_m: string | null;
  planned_duration_s: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FindRouteStopsOpts {
  routeId?: string;
  status?: string;
  page: number;
  limit: number;
}

export async function findRouteStopsByOrg(
  orgId: string,
  opts: FindRouteStopsOpts,
): Promise<{ data: RouteStopRow[]; total: number }> {
  const conditions: string[] = ['rs.organization_id = $1'];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (opts.routeId) {
    conditions.push(`rs.route_id = $${idx++}`);
    params.push(opts.routeId);
  }
  if (opts.status) {
    conditions.push(`rs.status = $${idx++}`);
    params.push(opts.status);
  }

  const where = conditions.join(' AND ');
  const offset = (opts.page - 1) * opts.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM route_stops rs WHERE ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  const dataResult = await query<RouteStopRow>(
    `SELECT rs.* FROM route_stops rs WHERE ${where} ORDER BY rs.stop_order ASC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, opts.limit, offset],
  );

  return { data: dataResult.rows, total };
}

export async function findRouteStopById(id: string, orgId: string): Promise<RouteStopRow | null> {
  const result = await query<RouteStopRow>(
    `SELECT rs.* FROM route_stops rs
     JOIN routes r ON r.id = rs.route_id
     WHERE rs.id = $1 AND r.organization_id = $2`,
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function updateRouteStopStatus(
  id: string,
  orgId: string,
  status: string,
): Promise<RouteStopRow | null> {
  const result = await query<RouteStopRow>(
    `UPDATE route_stops rs
     SET status = $1, updated_at = NOW()
     FROM routes r
     WHERE rs.id = $2 AND r.id = rs.route_id AND r.organization_id = $3
     RETURNING rs.*`,
    [status, id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function findRouteStopsByRouteId(
  routeId: string,
  orgId: string,
): Promise<RouteStopRow[]> {
  const result = await query<RouteStopRow>(
    `SELECT rs.* FROM route_stops rs
     JOIN routes r ON r.id = rs.route_id
     WHERE rs.route_id = $1 AND r.organization_id = $2
     ORDER BY rs.stop_order ASC`,
    [routeId, orgId],
  );
  return result.rows;
}

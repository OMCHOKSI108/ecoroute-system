import { query } from '../config/db';

export interface VehicleLocationRow {
  id: string;
  vehicle_id: string;
  organization_id: string;
  latitude: number;
  longitude: number;
  recorded_at: Date;
}

export interface VehicleLocationLatestRow {
  vehicle_id: string;
  organization_id: string;
  latitude: number;
  longitude: number;
  recorded_at: Date;
}

export async function insertLocation(
  vehicleId: string,
  orgId: string,
  latitude: number,
  longitude: number,
  recordedAt: string,
): Promise<void> {
  await query(
    `INSERT INTO vehicle_locations (vehicle_id, organization_id, latitude, longitude, location, recorded_at)
     VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography, $5)`,
    [vehicleId, orgId, latitude, longitude, recordedAt],
  );
}

export async function upsertLatestLocation(
  vehicleId: string,
  orgId: string,
  latitude: number,
  longitude: number,
  recordedAt: string,
): Promise<void> {
  await query(
    `INSERT INTO vehicle_location_latest (vehicle_id, organization_id, latitude, longitude, location, recorded_at)
     VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography, $5)
     ON CONFLICT (vehicle_id) DO UPDATE SET
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       location = EXCLUDED.location,
       recorded_at = EXCLUDED.recorded_at,
       organization_id = EXCLUDED.organization_id`,
    [vehicleId, orgId, latitude, longitude, recordedAt],
  );
}

export async function findLatestLocation(
  vehicleId: string,
  orgId: string,
): Promise<VehicleLocationLatestRow | null> {
  const result = await query<VehicleLocationLatestRow>(
    'SELECT * FROM vehicle_location_latest WHERE vehicle_id = $1 AND organization_id = $2',
    [vehicleId, orgId],
  );
  return result.rows[0] ?? null;
}

export async function findAllLatestLocations(orgId: string): Promise<VehicleLocationLatestRow[]> {
  const result = await query<VehicleLocationLatestRow>(
    'SELECT * FROM vehicle_location_latest WHERE organization_id = $1',
    [orgId],
  );
  return result.rows;
}

export async function findLocationHistory(
  vehicleId: string,
  orgId: string,
  opts: { from?: string; to?: string; page: number; limit: number },
): Promise<{ data: VehicleLocationRow[]; total: number }> {
  const conditions: string[] = ['vehicle_id = $1', 'organization_id = $2'];
  const params: unknown[] = [vehicleId, orgId];
  let idx = 3;

  if (opts.from) {
    conditions.push(`recorded_at >= $${idx++}`);
    params.push(opts.from);
  }
  if (opts.to) {
    conditions.push(`recorded_at <= $${idx++}`);
    params.push(opts.to);
  }

  const where = conditions.join(' AND ');
  const offset = (opts.page - 1) * opts.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM vehicle_locations WHERE ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  const dataResult = await query<VehicleLocationRow>(
    `SELECT * FROM vehicle_locations WHERE ${where} ORDER BY recorded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, opts.limit, offset],
  );

  return { data: dataResult.rows, total };
}

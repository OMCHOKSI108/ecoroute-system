import { PoolClient } from 'pg';
import { query } from '../config/db';

export interface PickupRow {
  id: string;
  organization_id: string;
  business_id: string;
  assigned_vehicle_id: string | null;
  requested_by: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_at: Date | null;
  notes: string | null;
  waste_category: string;
  estimated_weight_kg: string | null; // pg returns DECIMAL as string
  created_at: Date;
  updated_at: Date;
}

export interface CreatePickupData {
  businessId: string;
  requestedBy: string;
  wasteCategory: string;
  estimatedWeightKg?: number;
  scheduledAt?: string;
  notes?: string;
}

export async function createPickup(data: CreatePickupData, orgId: string): Promise<PickupRow | null> {
  // INSERT ... SELECT validates business belongs to org atomically
  const result = await query<PickupRow>(
    `INSERT INTO pickup_requests
       (organization_id, business_id, requested_by, waste_category, estimated_weight_kg, scheduled_at, notes)
     SELECT $1, b.id, $3, $4, $5, $6, $7
     FROM businesses b
     WHERE b.id = $2 AND b.organization_id = $1
     RETURNING *`,
    [
      orgId,
      data.businessId,
      data.requestedBy,
      data.wasteCategory,
      data.estimatedWeightKg ?? null,
      data.scheduledAt ?? null,
      data.notes ?? null,
    ],
  );
  return result.rows[0] ?? null;
}

export async function findPickupsByOrg(
  orgId: string,
  options: { page: number; limit: number; status?: string; vehicleId?: string; businessId?: string },
): Promise<{ data: PickupRow[]; total: number }> {
  const conditions = ['organization_id = $1'];
  const params: unknown[] = [orgId];

  if (options.status) {
    params.push(options.status);
    conditions.push(`status = $${params.length}`);
  }
  if (options.vehicleId) {
    params.push(options.vehicleId);
    conditions.push(`assigned_vehicle_id = $${params.length}`);
  }
  if (options.businessId) {
    params.push(options.businessId);
    conditions.push(`business_id = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const offset = (options.page - 1) * options.limit;

  const [dataResult, countResult] = await Promise.all([
    query<PickupRow>(
      `SELECT * FROM pickup_requests WHERE ${where} ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, options.limit, offset],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM pickup_requests WHERE ${where}`,
      params,
    ),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0]?.count ?? '0', 10),
  };
}

export async function findPickupByIdAndOrg(
  id: string,
  orgId: string,
): Promise<PickupRow | null> {
  const result = await query<PickupRow>(
    'SELECT * FROM pickup_requests WHERE id = $1 AND organization_id = $2',
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function updatePickup(
  id: string,
  orgId: string,
  fields: Record<string, unknown>,
): Promise<PickupRow | null> {
  const keys = Object.keys(fields);
  if (keys.length === 0) {
    return findPickupByIdAndOrg(id, orgId);
  }
  const setClauses = keys.map((k, i) => `${k} = $${i + 3}`);
  const values = Object.values(fields);
  const result = await query<PickupRow>(
    `UPDATE pickup_requests SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [id, orgId, ...values],
  );
  return result.rows[0] ?? null;
}

export async function updatePickupStatus(
  id: string,
  orgId: string,
  status: string,
): Promise<PickupRow | null> {
  const result = await query<PickupRow>(
    `UPDATE pickup_requests SET status = $1, updated_at = NOW()
     WHERE id = $2 AND organization_id = $3
     RETURNING *`,
    [status, id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function findNearbyPickups(
  orgId: string,
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<PickupRow[]> {
  // ST_MakePoint(lng, lat) — PostGIS expects longitude first
  const result = await query<PickupRow>(
    `SELECT pr.*
     FROM pickup_requests pr
     JOIN businesses b ON b.id = pr.business_id
     WHERE pr.organization_id = $1
       AND ST_DWithin(
         b.location,
         ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
         $4
       )
     ORDER BY ST_Distance(b.location, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography)`,
    [orgId, lat, lng, radiusMeters],
  );
  return result.rows;
}

export async function findPickupsByDriverId(
  driverId: string,
  orgId: string,
): Promise<PickupRow[]> {
  const result = await query<PickupRow>(
    `SELECT pr.*
     FROM pickup_requests pr
     JOIN vehicles v ON v.id = pr.assigned_vehicle_id
     WHERE v.driver_id = $1 AND pr.organization_id = $2
       AND pr.status IN ('assigned', 'in_progress')
     ORDER BY pr.created_at ASC`,
    [driverId, orgId],
  );
  return result.rows;
}

export async function lockPickupsForUpdate(
  client: PoolClient,
  ids: string[],
  orgId: string,
): Promise<PickupRow[]> {
  const result = await client.query<PickupRow>(
    'SELECT * FROM pickup_requests WHERE id = ANY($1::uuid[]) AND organization_id = $2 FOR UPDATE',
    [ids, orgId],
  );
  return result.rows;
}

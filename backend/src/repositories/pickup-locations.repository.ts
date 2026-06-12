import { query } from '../config/db';

export interface PickupLocationRow {
  id: string;
  organization_id: string;
  business_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createPickupLocation(data: {
  organizationId: string;
  businessId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}): Promise<PickupLocationRow> {
  const result = await query<PickupLocationRow>(
    `INSERT INTO pickup_locations
       (organization_id, business_id, name, address, latitude, longitude, location)
     VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography)
     RETURNING *`,
    [data.organizationId, data.businessId, data.name, data.address ?? null, data.latitude, data.longitude],
  );
  return result.rows[0]!;
}

export async function findPickupLocationsByBusiness(
  businessId: string,
  orgId: string,
): Promise<PickupLocationRow[]> {
  const result = await query<PickupLocationRow>(
    `SELECT * FROM pickup_locations
     WHERE business_id = $1 AND organization_id = $2
     ORDER BY created_at DESC`,
    [businessId, orgId],
  );
  return result.rows;
}

export async function findPickupLocationById(
  id: string,
  orgId: string,
): Promise<PickupLocationRow | null> {
  const result = await query<PickupLocationRow>(
    'SELECT * FROM pickup_locations WHERE id = $1 AND organization_id = $2',
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function updatePickupLocation(
  id: string,
  orgId: string,
  data: Partial<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
  }>,
): Promise<PickupLocationRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); params.push(data.name); }
  if (data.address !== undefined) { sets.push(`address = $${idx++}`); params.push(data.address); }
  if (data.latitude !== undefined && data.longitude !== undefined) {
    sets.push(`latitude = $${idx++}, longitude = $${idx++}, location = ST_SetSRID(ST_MakePoint($${idx - 1}, $${idx - 2}), 4326)::geography`);
    params.push(data.latitude, data.longitude);
  } else if (data.latitude !== undefined) {
    sets.push(`latitude = $${idx++}`); params.push(data.latitude);
  } else if (data.longitude !== undefined) {
    sets.push(`longitude = $${idx++}`); params.push(data.longitude);
  }
  if (data.isActive !== undefined) { sets.push(`is_active = $${idx++}`); params.push(data.isActive); }

  if (sets.length === 0) return null;

  sets.push('updated_at = NOW()');
  params.push(id, orgId);

  const result = await query<PickupLocationRow>(
    `UPDATE pickup_locations SET ${sets.join(', ')} WHERE id = $${idx} AND organization_id = $${idx + 1} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}

export async function deletePickupLocation(
  id: string,
  orgId: string,
): Promise<boolean> {
  const result = await query(
    'DELETE FROM pickup_locations WHERE id = $1 AND organization_id = $2',
    [id, orgId],
  );
  return (result.rowCount ?? 0) > 0;
}

import { PoolClient } from 'pg';
import { query } from '../config/db';
import { ConflictError } from '../types/errors';

export interface VehicleRow {
  id: string;
  organization_id: string;
  plate_number: string;
  model: string;
  capacity_kg: string; // pg returns DECIMAL as string
  current_load_kg: string;
  status: 'available' | 'dispatched' | 'maintenance' | 'offline';
  driver_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVehicleData {
  plateNumber: string;
  model: string;
  capacityKg: number;
}

export async function createVehicle(data: CreateVehicleData, orgId: string): Promise<VehicleRow> {
  try {
    const result = await query<VehicleRow>(
      `INSERT INTO vehicles (organization_id, plate_number, model, capacity_kg)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orgId, data.plateNumber, data.model, data.capacityKg],
    );
    return result.rows[0]!;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      throw new ConflictError(`Plate number '${data.plateNumber}' is already registered in this organization`);
    }
    throw err;
  }
}

export async function findVehiclesByOrg(
  orgId: string,
  options: { page: number; limit: number; status?: string },
): Promise<{ data: VehicleRow[]; total: number }> {
  const conditions = ['organization_id = $1'];
  const params: unknown[] = [orgId];

  if (options.status) {
    params.push(options.status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const offset = (options.page - 1) * options.limit;

  const [dataResult, countResult] = await Promise.all([
    query<VehicleRow>(
      `SELECT * FROM vehicles WHERE ${where} ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, options.limit, offset],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM vehicles WHERE ${where}`,
      params,
    ),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0]?.count ?? '0', 10),
  };
}

export async function findVehicleByIdAndOrg(
  id: string,
  orgId: string,
): Promise<VehicleRow | null> {
  const result = await query<VehicleRow>(
    'SELECT * FROM vehicles WHERE id = $1 AND organization_id = $2',
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function updateVehicle(
  id: string,
  orgId: string,
  fields: Record<string, unknown>,
): Promise<VehicleRow | null> {
  const keys = Object.keys(fields);
  if (keys.length === 0) {
    return findVehicleByIdAndOrg(id, orgId);
  }
  const setClauses = keys.map((k, i) => `${k} = $${i + 3}`);
  const values = Object.values(fields);
  const result = await query<VehicleRow>(
    `UPDATE vehicles SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [id, orgId, ...values],
  );
  return result.rows[0] ?? null;
}

export async function updateVehicleStatus(
  id: string,
  orgId: string,
  status: string,
): Promise<VehicleRow | null> {
  const result = await query<VehicleRow>(
    `UPDATE vehicles SET status = $1, updated_at = NOW()
     WHERE id = $2 AND organization_id = $3
     RETURNING *`,
    [status, id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function assignDriver(
  id: string,
  orgId: string,
  driverId: string | null,
): Promise<VehicleRow | null> {
  const result = await query<VehicleRow>(
    `UPDATE vehicles SET driver_id = $1, updated_at = NOW()
     WHERE id = $2 AND organization_id = $3
     RETURNING *`,
    [driverId, id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function driverExistsInOrg(driverId: string, orgId: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `SELECT id FROM users WHERE id = $1 AND organization_id = $2 AND role = 'driver' AND is_active = true`,
    [driverId, orgId],
  );
  return result.rows.length > 0;
}

export async function lockVehicleForUpdate(
  client: PoolClient,
  id: string,
  orgId: string,
): Promise<VehicleRow | null> {
  const result = await client.query<VehicleRow>(
    'SELECT * FROM vehicles WHERE id = $1 AND organization_id = $2 FOR UPDATE',
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

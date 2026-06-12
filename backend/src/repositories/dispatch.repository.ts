import { PoolClient } from 'pg';
import { query } from '../config/db';
import type { VehicleRow } from './vehicles.repository';
import type { PickupRow } from './pickups.repository';

// All functions accept an open PoolClient — they participate in the caller's transaction.

export async function lockVehicle(
  client: PoolClient,
  vehicleId: string,
  orgId: string,
): Promise<VehicleRow | null> {
  const result = await client.query<VehicleRow>(
    'SELECT * FROM vehicles WHERE id = $1 AND organization_id = $2 FOR UPDATE',
    [vehicleId, orgId],
  );
  return result.rows[0] ?? null;
}

export async function lockPickups(
  client: PoolClient,
  pickupIds: string[],
  orgId: string,
): Promise<PickupRow[]> {
  const result = await client.query<PickupRow>(
    `SELECT *
     FROM pickup_requests
     WHERE id = ANY($1::uuid[]) AND organization_id = $2
     ORDER BY id
     FOR UPDATE`,
    [pickupIds, orgId],
  );
  return result.rows;
}

export async function updateVehicleDispatched(
  client: PoolClient,
  vehicleId: string,
  additionalLoadKg: number,
): Promise<VehicleRow> {
  const result = await client.query<VehicleRow>(
    `UPDATE vehicles
     SET status = 'dispatched',
         current_load_kg = current_load_kg + $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [vehicleId, additionalLoadKg],
  );
  return result.rows[0]!;
}

export async function findPickupsByIds(ids: string[], orgId: string): Promise<PickupRow[]> {
  const result = await query<PickupRow>(
    `SELECT * FROM pickup_requests WHERE id = ANY($1::uuid[]) AND organization_id = $2 ORDER BY id`,
    [ids, orgId],
  );
  return result.rows;
}

export async function findAvailableVehicles(orgId: string): Promise<VehicleRow[]> {
  const result = await query<VehicleRow>(
    `SELECT * FROM vehicles WHERE organization_id = $1 AND status = 'available' ORDER BY created_at ASC`,
    [orgId],
  );
  return result.rows;
}

export async function findUnassignedPendingPickups(orgId: string): Promise<PickupRow[]> {
  const result = await query<PickupRow>(
    `SELECT * FROM pickup_requests WHERE organization_id = $1 AND status = 'pending' ORDER BY created_at ASC`,
    [orgId],
  );
  return result.rows;
}

export async function assignPickupsToVehicle(
  client: PoolClient,
  pickupIds: string[],
  vehicleId: string,
): Promise<PickupRow[]> {
  const result = await client.query<PickupRow>(
    `UPDATE pickup_requests
     SET status = 'assigned',
         assigned_vehicle_id = $1,
         updated_at = NOW()
     WHERE id = ANY($2::uuid[])
       AND status = 'pending'
       AND assigned_vehicle_id IS NULL
     RETURNING *`,
    [vehicleId, pickupIds],
  );
  return result.rows;
}

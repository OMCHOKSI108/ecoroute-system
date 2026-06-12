import { query } from '../config/db';
import type { UserRow } from './auth.repository';

export interface FindDriversOpts {
  page: number;
  limit: number;
  driverStatus?: string;
  isActive?: boolean;
}

export async function findDriversByOrg(
  orgId: string,
  opts: FindDriversOpts,
): Promise<{ data: UserRow[]; total: number }> {
  const conditions: string[] = ["organization_id = $1 AND role = 'driver'"];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (opts.driverStatus) {
    conditions.push(`driver_status = $${idx++}`);
    params.push(opts.driverStatus);
  }
  if (opts.isActive !== undefined) {
    conditions.push(`is_active = $${idx++}`);
    params.push(opts.isActive);
  }

  const where = conditions.join(' AND ');
  const offset = (opts.page - 1) * opts.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM users WHERE ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  const dataResult = await query<UserRow>(
    `SELECT * FROM users WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, opts.limit, offset],
  );

  return { data: dataResult.rows, total };
}

export async function findDriverById(id: string, orgId: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT * FROM users WHERE id = $1 AND organization_id = $2 AND role = 'driver'`,
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function updateDriver(
  id: string,
  orgId: string,
  fields: Record<string, unknown>,
): Promise<UserRow | null> {
  const keys = Object.keys(fields);
  if (keys.length === 0) {
    return findDriverById(id, orgId);
  }
  const setClauses = keys.map((k, i) => `${k} = $${i + 3}`);
  const values = Object.values(fields);
  const result = await query<UserRow>(
    `UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 AND role = 'driver'
     RETURNING *`,
    [id, orgId, ...values],
  );
  return result.rows[0] ?? null;
}

export async function updateDriverStatus(
  id: string,
  orgId: string,
  status: string,
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET driver_status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 AND role = 'driver' RETURNING *`,
    [status, id, orgId],
  );
  return result.rows[0] ?? null;
}

import { query } from '../config/db';
import type { UserRow } from './auth.repository';

export interface FindUsersOpts {
  page: number;
  limit: number;
  role?: string;
  isActive?: boolean;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findUsersByOrg(
  orgId: string,
  opts: FindUsersOpts,
): Promise<{ data: UserRow[]; total: number }> {
  const conditions: string[] = ['organization_id = $1'];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (opts.role) {
    conditions.push(`role = $${idx++}`);
    params.push(opts.role);
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

export async function updateUserRole(
  id: string,
  orgId: string,
  role: string,
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *`,
    [role, id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function updateUser(
  id: string,
  fields: Record<string, unknown>,
): Promise<UserRow | null> {
  const keys = Object.keys(fields);
  if (keys.length === 0) {
    const existing = await findUserById(id);
    return existing;
  }
  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = Object.values(fields);
  const result = await query<UserRow>(
    `UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return result.rows[0] ?? null;
}

export async function updateUserStatus(
  id: string,
  orgId: string,
  isActive: boolean,
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *`,
    [isActive, id, orgId],
  );
  return result.rows[0] ?? null;
}

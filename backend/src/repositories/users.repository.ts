import { query } from '../config/db';
import type { UserRow } from './auth.repository';

export interface FindUsersOpts {
  page: number;
  limit: number;
  role?: string;
  isActive?: boolean;
}

export interface UserWithBusinessRow extends UserRow {
  business_name?: string | null;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'business_user';
  phone?: string | null;
  businessId?: string | null;
  driverStatus?: string | null;
}

export async function findUserById(id: string): Promise<UserWithBusinessRow | null> {
  const result = await query<UserWithBusinessRow>(
    `SELECT u.*, b.name AS business_name
     FROM users u
     LEFT JOIN businesses b ON b.id = u.business_id
     WHERE u.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] ?? null;
}

export async function createUser(orgId: string, data: CreateUserData): Promise<UserWithBusinessRow> {
  const result = await query<UserRow>(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, phone, business_id, driver_status, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
     RETURNING *`,
    [
      orgId,
      data.email,
      data.passwordHash,
      data.firstName,
      data.lastName,
      data.role,
      data.phone ?? null,
      data.businessId ?? null,
      data.driverStatus ?? (data.role === 'driver' ? 'available' : null),
    ],
  );
  return findUserById(result.rows[0].id) as Promise<UserWithBusinessRow>;
}

export async function findUsersByOrg(
  orgId: string,
  opts: FindUsersOpts,
): Promise<{ data: UserWithBusinessRow[]; total: number }> {
  const conditions: string[] = ['u.organization_id = $1'];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (opts.role) {
    conditions.push(`u.role = $${idx++}`);
    params.push(opts.role);
  }
  if (opts.isActive !== undefined) {
    conditions.push(`u.is_active = $${idx++}`);
    params.push(opts.isActive);
  }

  const where = conditions.join(' AND ');
  const offset = (opts.page - 1) * opts.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM users u WHERE ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  const dataResult = await query<UserWithBusinessRow>(
    `SELECT u.*, b.name AS business_name
     FROM users u
     LEFT JOIN businesses b ON b.id = u.business_id
     WHERE ${where}
     ORDER BY u.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, opts.limit, offset],
  );

  return { data: dataResult.rows, total };
}

export async function updateUserRole(
  id: string,
  orgId: string,
  role: string,
  businessId?: string | null,
): Promise<UserWithBusinessRow | null> {
  let result;
  if (businessId !== undefined) {
    result = await query<UserRow>(
      `UPDATE users SET role = $1, business_id = $2, updated_at = NOW() WHERE id = $3 AND organization_id = $4 RETURNING *`,
      [role, businessId, id, orgId],
    );
  } else {
    result = await query<UserRow>(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *`,
      [role, id, orgId],
    );
  }
  if (!result.rows[0]) return null;
  return findUserById(result.rows[0].id);
}

const ALLOWED_USER_UPDATE_COLUMNS = new Set([
  'first_name',
  'last_name',
  'phone',
  'is_active',
  'role',
  'driver_status',
  'business_id',
  'password_hash',
]);

export async function updateUser(
  id: string,
  fields: Record<string, unknown>,
  orgId?: string,
): Promise<UserWithBusinessRow | null> {
  const safeKeys = Object.keys(fields).filter((k) => ALLOWED_USER_UPDATE_COLUMNS.has(k));
  if (safeKeys.length === 0) {
    return findUserById(id);
  }
  const setClauses = safeKeys.map((k, i) => `${k} = $${i + 2}`);
  const values = safeKeys.map((k) => fields[k]);
  const whereClause = orgId
    ? `WHERE id = $1 AND organization_id = $${safeKeys.length + 2}`
    : `WHERE id = $1`;
  const params = orgId ? [id, ...values, orgId] : [id, ...values];

  const result = await query<UserRow>(
    `UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW() ${whereClause} RETURNING *`,
    params,
  );
  if (!result.rows[0]) return null;
  return findUserById(result.rows[0].id);
}

export async function updateUserStatus(
  id: string,
  orgId: string,
  isActive: boolean,
): Promise<UserWithBusinessRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *`,
    [isActive, id, orgId],
  );
  if (!result.rows[0]) return null;
  return findUserById(result.rows[0].id);
}

export async function deleteUser(id: string, orgId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM users WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [id, orgId],
  );
  return (result.rowCount ?? 0) > 0;
}

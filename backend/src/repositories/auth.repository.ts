import { PoolClient } from 'pg';
import { query, withTransaction } from '../config/db';

export interface OrganizationRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRow {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'dispatcher' | 'driver';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrgAndUserData {
  orgName: string;
  orgEmail: string;
  firstName: string;
  lastName: string;
  userEmail: string;
  passwordHash: string;
}

export interface PasswordResetOtpRow {
  id: string;
  user_id: string;
  otp_hash: string;
  expires_at: Date;
  used_at: Date | null;
  attempts: number;
  created_at: Date;
}

export interface CreatePasswordResetOtpData {
  userId: string;
  otpHash: string;
  expiresAt: Date;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findOrganizationByEmail(email: string): Promise<OrganizationRow | null> {
  const result = await query<OrganizationRow>(
    'SELECT * FROM organizations WHERE email = $1',
    [email],
  );
  return result.rows[0] ?? null;
}

export async function updatePassword(userId: string, newPasswordHash: string): Promise<void> {
  await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newPasswordHash, userId],
  );
}

export async function createPasswordResetOtp(
  data: CreatePasswordResetOtpData,
): Promise<PasswordResetOtpRow> {
  const result = await query<PasswordResetOtpRow>(
    `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.userId, data.otpHash, data.expiresAt],
  );

  return result.rows[0]!;
}

export async function findLatestValidResetOtp(
  userId: string,
): Promise<PasswordResetOtpRow | null> {
  const result = await query<PasswordResetOtpRow>(
    `SELECT *
     FROM password_reset_otps
     WHERE user_id = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function incrementResetOtpAttempts(id: string): Promise<void> {
  await query(
    `UPDATE password_reset_otps
     SET attempts = attempts + 1
     WHERE id = $1`,
    [id],
  );
}

export async function markResetOtpUsed(id: string): Promise<void> {
  await query(
    `UPDATE password_reset_otps
     SET used_at = NOW()
     WHERE id = $1`,
    [id],
  );
}

export async function createOrganizationAndAdminUser(
  data: CreateOrgAndUserData,
): Promise<{ org: OrganizationRow; user: UserRow }> {
  return withTransaction(async (client: PoolClient) => {
    const orgResult = await client.query<OrganizationRow>(
      `INSERT INTO organizations (name, email)
       VALUES ($1, $2)
       RETURNING *`,
      [data.orgName, data.orgEmail],
    );
    const org = orgResult.rows[0]!;

    const userResult = await client.query<UserRow>(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')
       RETURNING *`,
      [org.id, data.userEmail, data.passwordHash, data.firstName, data.lastName],
    );
    const user = userResult.rows[0]!;

    return { org, user };
  });
}

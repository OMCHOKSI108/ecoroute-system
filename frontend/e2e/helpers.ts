import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433', 10),
  database: process.env.DATABASE_NAME || 'ecoroute_db',
  user: process.env.DATABASE_USER || 'ecoroute_user',
  password: process.env.DATABASE_PASSWORD || 'ecoroute_password',
});

export async function createOrgUser(
  orgId: string,
  email: string,
  role: 'admin' | 'dispatcher' | 'driver' | 'business_user',
  options?: {
    firstName?: string;
    lastName?: string;
    driverStatus?: 'available' | 'on_route' | 'off_duty';
    password?: string;
  },
) {
  const hash = await bcrypt.hash(options?.password || 'Password123!', 10);
  const res = await pool.query(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, driver_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, role`,
    [
      orgId,
      email,
      hash,
      options?.firstName || 'Test',
      options?.lastName || role,
      role,
      options?.driverStatus || (role === 'driver' ? 'available' : null),
    ],
  );
  return res.rows[0];
}

export async function getOrgIdForUser(email: string): Promise<string | null> {
  const res = await pool.query('SELECT organization_id FROM users WHERE email = $1', [email]);
  return res.rows[0]?.organization_id || null;
}

export async function closePool() {
  await pool.end();
}

export { pool };

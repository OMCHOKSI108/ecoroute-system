import { query } from '../config/db';
import type { OrganizationRow } from './auth.repository';

export interface FindOrganizationsOpts {
  page: number;
  limit: number;
}

export async function createOrganization(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}): Promise<OrganizationRow> {
  const result = await query<OrganizationRow>(
    `INSERT INTO organizations (name, email, phone, address)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.email, data.phone ?? null, data.address ?? null],
  );
  return result.rows[0]!;
}

export async function findOrganizationById(id: string): Promise<OrganizationRow | null> {
  const result = await query<OrganizationRow>(
    'SELECT * FROM organizations WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findOrganizations(
  opts: FindOrganizationsOpts,
): Promise<{ data: OrganizationRow[]; total: number }> {
  const offset = (opts.page - 1) * opts.limit;

  const countResult = await query<{ count: string }>('SELECT COUNT(*) FROM organizations');
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  const dataResult = await query<OrganizationRow>(
    'SELECT * FROM organizations ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [opts.limit, offset],
  );

  return { data: dataResult.rows, total };
}

export async function updateOrganization(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    isActive: boolean;
  }>,
): Promise<OrganizationRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); params.push(data.name); }
  if (data.email !== undefined) { sets.push(`email = $${idx++}`); params.push(data.email); }
  if (data.phone !== undefined) { sets.push(`phone = $${idx++}`); params.push(data.phone); }
  if (data.address !== undefined) { sets.push(`address = $${idx++}`); params.push(data.address); }
  if (data.isActive !== undefined) { sets.push(`is_active = $${idx++}`); params.push(data.isActive); }

  if (sets.length === 0) return null;

  sets.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query<OrganizationRow>(
    `UPDATE organizations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}

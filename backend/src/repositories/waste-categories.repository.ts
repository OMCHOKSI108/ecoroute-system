import { query } from '../config/db';

export interface WasteCategoryRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function createWasteCategory(data: {
  organizationId: string;
  name: string;
  description?: string;
}): Promise<WasteCategoryRow> {
  const result = await query<WasteCategoryRow>(
    `INSERT INTO waste_categories (organization_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.organizationId, data.name, data.description ?? null],
  );
  return result.rows[0]!;
}

export async function findWasteCategoriesByOrg(orgId: string): Promise<WasteCategoryRow[]> {
  const result = await query<WasteCategoryRow>(
    'SELECT * FROM waste_categories WHERE organization_id = $1 ORDER BY name',
    [orgId],
  );
  return result.rows;
}

export async function findWasteCategoryById(id: string, orgId: string): Promise<WasteCategoryRow | null> {
  const result = await query<WasteCategoryRow>(
    'SELECT * FROM waste_categories WHERE id = $1 AND organization_id = $2',
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function updateWasteCategory(
  id: string,
  orgId: string,
  data: Partial<{ name: string; description: string; isActive: boolean }>,
): Promise<WasteCategoryRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); params.push(data.name); }
  if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }
  if (data.isActive !== undefined) { sets.push(`is_active = $${idx++}`); params.push(data.isActive); }

  if (sets.length === 0) return null;

  sets.push('updated_at = NOW()');
  params.push(id, orgId);

  const result = await query<WasteCategoryRow>(
    `UPDATE waste_categories SET ${sets.join(', ')} WHERE id = $${idx} AND organization_id = $${idx + 1} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}

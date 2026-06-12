import { query } from '../config/db';

export interface BusinessRow {
  id: string;
  organization_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string;
  latitude: number;
  longitude: number;
  waste_categories: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBusinessData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contactEmail?: string;
  contactPhone?: string;
  wasteCategories?: string[];
}

export interface ListOptions {
  page: number;
  limit: number;
  isActive?: boolean;
}

export async function createBusiness(
  data: CreateBusinessData,
  orgId: string,
): Promise<BusinessRow> {
  // longitude first per PostGIS convention for ST_MakePoint
  const result = await query<BusinessRow>(
    `INSERT INTO businesses
       (organization_id, name, address, latitude, longitude, location, contact_email, contact_phone, waste_categories)
     VALUES
       ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, $6, $7, $8)
     RETURNING id, organization_id, name, address, latitude, longitude,
               contact_email, contact_phone, waste_categories, is_active, created_at, updated_at`,
    [
      orgId,
      data.name,
      data.address,
      data.latitude,
      data.longitude,
      data.contactEmail ?? null,
      data.contactPhone ?? null,
      data.wasteCategories ?? [],
    ],
  );
  return result.rows[0]!;
}

export async function findBusinessesByOrg(
  orgId: string,
  options: ListOptions,
): Promise<{ data: BusinessRow[]; total: number }> {
  const { page, limit, isActive } = options;
  const offset = (page - 1) * limit;

  const conditions = ['organization_id = $1'];
  const params: unknown[] = [orgId];

  if (isActive !== undefined) {
    params.push(isActive);
    conditions.push(`is_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  const [dataResult, countResult] = await Promise.all([
    query<BusinessRow>(
      `SELECT id, organization_id, name, address, latitude, longitude,
              contact_email, contact_phone, waste_categories, is_active, created_at, updated_at
       FROM businesses
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM businesses WHERE ${where}`,
      params,
    ),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0]?.count ?? '0', 10),
  };
}

export async function softDeleteBusiness(id: string, orgId: string): Promise<BusinessRow | null> {
  const result = await query<BusinessRow>(
    `UPDATE businesses SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id, organization_id, name, address, latitude, longitude,
               contact_email, contact_phone, waste_categories, is_active, created_at, updated_at`,
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

export async function findBusinessByIdAndOrg(
  id: string,
  orgId: string,
): Promise<BusinessRow | null> {
  const result = await query<BusinessRow>(
    `SELECT id, organization_id, name, address, latitude, longitude,
            contact_email, contact_phone, waste_categories, is_active, created_at, updated_at
     FROM businesses
     WHERE id = $1 AND organization_id = $2`,
    [id, orgId],
  );
  return result.rows[0] ?? null;
}

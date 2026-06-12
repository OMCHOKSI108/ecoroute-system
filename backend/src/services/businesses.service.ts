import * as businessRepo from '../repositories/businesses.repository';
import { NotFoundError } from '../types/errors';
import type { CreateBusinessInput, ListBusinessesQuery } from '../schemas/businesses.schemas';

export interface BusinessResponse {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contactEmail: string | null;
  contactPhone: string | null;
  wasteCategories: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toBusinessResponse(row: businessRepo.BusinessRow): BusinessResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    wasteCategories: row.waste_categories,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createBusiness(
  input: CreateBusinessInput,
  orgId: string,
): Promise<BusinessResponse> {
  const row = await businessRepo.createBusiness(input, orgId);
  return toBusinessResponse(row);
}

export async function listBusinesses(
  orgId: string,
  query: ListBusinessesQuery,
): Promise<{ data: BusinessResponse[]; total: number; page: number; limit: number }> {
  const isActive = query.isActive === undefined ? undefined : query.isActive === 'true';

  const { data, total } = await businessRepo.findBusinessesByOrg(orgId, {
    page: query.page,
    limit: query.limit,
    isActive,
  });

  return {
    data: data.map(toBusinessResponse),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getBusinessById(id: string, orgId: string): Promise<BusinessResponse> {
  const row = await businessRepo.findBusinessByIdAndOrg(id, orgId);
  // Return 404 regardless of whether it belongs to another org — do not reveal existence
  if (!row) throw new NotFoundError('Business not found');
  return toBusinessResponse(row);
}

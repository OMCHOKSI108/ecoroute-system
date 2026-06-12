import * as plRepo from '../repositories/pickup-locations.repository';
import { NotFoundError } from '../types/errors';
import type { CreatePickupLocationInput, UpdatePickupLocationInput } from '../schemas/pickup-locations.schemas';

export interface PickupLocationResponse {
  id: string;
  organizationId: string;
  businessId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toResponse(row: plRepo.PickupLocationRow): PickupLocationResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    businessId: row.business_id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createPickupLocation(
  businessId: string,
  orgId: string,
  input: CreatePickupLocationInput,
): Promise<PickupLocationResponse> {
  const row = await plRepo.createPickupLocation({
    organizationId: orgId,
    businessId,
    name: input.name,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
  });
  return toResponse(row);
}

export async function listPickupLocations(
  businessId: string,
  orgId: string,
): Promise<PickupLocationResponse[]> {
  const rows = await plRepo.findPickupLocationsByBusiness(businessId, orgId);
  return rows.map(toResponse);
}

export async function getPickupLocationById(
  id: string,
  orgId: string,
): Promise<PickupLocationResponse> {
  const row = await plRepo.findPickupLocationById(id, orgId);
  if (!row) throw new NotFoundError('Pickup location not found');
  return toResponse(row);
}

export async function updatePickupLocation(
  id: string,
  orgId: string,
  input: UpdatePickupLocationInput,
): Promise<PickupLocationResponse> {
  const row = await plRepo.updatePickupLocation(id, orgId, input);
  if (!row) throw new NotFoundError('Pickup location not found');
  return toResponse(row);
}

export async function deletePickupLocation(
  id: string,
  orgId: string,
): Promise<void> {
  const deleted = await plRepo.deletePickupLocation(id, orgId);
  if (!deleted) throw new NotFoundError('Pickup location not found');
}

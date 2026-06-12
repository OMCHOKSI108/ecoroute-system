import * as orgRepo from '../repositories/organizations.repository';
import { findOrganizationByEmail } from '../repositories/auth.repository';
import { ConflictError, NotFoundError } from '../types/errors';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  ListOrganizationsQuery,
} from '../schemas/organizations.schemas';
import type { OrganizationRow } from '../repositories/auth.repository';

export interface OrganizationResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toOrgResponse(row: OrganizationRow): OrganizationResponse {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function findOrgByEmail(email: string): Promise<OrganizationRow | null> {
  return findOrganizationByEmail(email);
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<OrganizationResponse> {
  const existing = await findOrgByEmail(input.email);
  if (existing) throw new ConflictError('An organization with this email already exists');
  const row = await orgRepo.createOrganization(input);
  return toOrgResponse(row);
}

export async function listOrganizations(
  queryParams: ListOrganizationsQuery,
): Promise<{ data: OrganizationResponse[]; total: number; page: number; limit: number }> {
  const { data, total } = await orgRepo.findOrganizations({
    page: queryParams.page,
    limit: queryParams.limit,
  });
  return {
    data: data.map(toOrgResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}

export async function getOrganizationById(id: string): Promise<OrganizationResponse> {
  const row = await orgRepo.findOrganizationById(id);
  if (!row) throw new NotFoundError('Organization not found');
  return toOrgResponse(row);
}

export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput,
): Promise<OrganizationResponse> {
  const row = await orgRepo.updateOrganization(id, input);
  if (!row) throw new NotFoundError('Organization not found');
  return toOrgResponse(row);
}

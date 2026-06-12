import * as wcRepo from '../repositories/waste-categories.repository';
import { ConflictError, NotFoundError } from '../types/errors';
import type { CreateWasteCategoryInput, UpdateWasteCategoryInput } from '../schemas/waste-categories.schemas';

export interface WasteCategoryResponse {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toResponse(row: wcRepo.WasteCategoryRow): WasteCategoryResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createWasteCategory(
  orgId: string,
  input: CreateWasteCategoryInput,
): Promise<WasteCategoryResponse> {
  const row = await wcRepo.createWasteCategory({
    organizationId: orgId,
    name: input.name,
    description: input.description,
  });
  return toResponse(row);
}

export async function listWasteCategories(
  orgId: string,
): Promise<WasteCategoryResponse[]> {
  const rows = await wcRepo.findWasteCategoriesByOrg(orgId);
  return rows.map(toResponse);
}

export async function getWasteCategoryById(
  id: string,
  orgId: string,
): Promise<WasteCategoryResponse> {
  const row = await wcRepo.findWasteCategoryById(id, orgId);
  if (!row) throw new NotFoundError('Waste category not found');
  return toResponse(row);
}

export async function updateWasteCategory(
  id: string,
  orgId: string,
  input: UpdateWasteCategoryInput,
): Promise<WasteCategoryResponse> {
  const row = await wcRepo.updateWasteCategory(id, orgId, input);
  if (!row) throw new NotFoundError('Waste category not found');
  return toResponse(row);
}

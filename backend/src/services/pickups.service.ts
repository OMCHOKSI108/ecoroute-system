import * as pickupRepo from '../repositories/pickups.repository';
import { logAudit } from './audit.service';
import { ConflictError, NotFoundError, ForbiddenError } from '../types/errors';
import type {
  CreatePickupInput,
  UpdatePickupStatusInput,
  ListPickupsQuery,
  NearbyPickupsQuery,
} from '../schemas/pickups.schemas';
import type { CancelPickupInput } from '../schemas/pickups.schemas';

export interface PickupResponse {
  id: string;
  organizationId: string;
  businessId: string;
  assignedVehicleId: string | null;
  requestedBy: string;
  status: string;
  scheduledAt: string | null;
  notes: string | null;
  wasteCategory: string;
  estimatedWeightKg: number | null;
  createdAt: string;
  updatedAt: string;
}

export function toPickupResponse(row: pickupRepo.PickupRow): PickupResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    businessId: row.business_id,
    assignedVehicleId: row.assigned_vehicle_id,
    requestedBy: row.requested_by,
    status: row.status,
    scheduledAt: row.scheduled_at?.toISOString() ?? null,
    notes: row.notes,
    wasteCategory: row.waste_category,
    estimatedWeightKg: row.estimated_weight_kg !== null ? parseFloat(row.estimated_weight_kg) : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  cancelled: ['pending', 'assigned'],
  in_progress: ['assigned'],
  completed: ['in_progress', 'assigned'],
};

export async function createPickup(
  input: CreatePickupInput,
  orgId: string,
  requestedBy: string,
  userRole?: string,
  userBusinessId?: string | null,
): Promise<PickupResponse> {
  if (userRole === 'business_user') {
    if (!userBusinessId) {
      throw new ForbiddenError('Business user is not linked to any business location');
    }
    if (input.businessId && input.businessId !== userBusinessId) {
      throw new ForbiddenError('Cannot create pickup for another business');
    }
    input.businessId = userBusinessId;
  }

  const row = await pickupRepo.createPickup(
    { ...input, requestedBy },
    orgId,
  );
  if (!row) throw new NotFoundError('Business not found in this organization');
  return toPickupResponse(row);
}

export async function listPickups(
  orgId: string,
  queryParams: ListPickupsQuery,
  userRole?: string,
  userBusinessId?: string | null,
): Promise<{ data: PickupResponse[]; total: number; page: number; limit: number }> {
  if (userRole === 'business_user' && userBusinessId) {
    queryParams.businessId = userBusinessId;
  }
  const { data, total } = await pickupRepo.findPickupsByOrg(orgId, queryParams);
  return {
    data: data.map(toPickupResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}

export async function getPickupById(
  id: string,
  orgId: string,
  userRole?: string,
  userBusinessId?: string | null,
): Promise<PickupResponse> {
  const row = await pickupRepo.findPickupByIdAndOrg(id, orgId);
  if (!row) throw new NotFoundError('Pickup request not found');
  if (userRole === 'business_user' && userBusinessId && row.business_id !== userBusinessId) {
    throw new ForbiddenError('Access to this pickup is restricted to its business');
  }
  return toPickupResponse(row);
}

export async function updatePickupStatus(
  id: string,
  orgId: string,
  input: UpdatePickupStatusInput,
  actorId?: string,
  actorRole?: string,
): Promise<PickupResponse> {
  const current = await pickupRepo.findPickupByIdAndOrg(id, orgId);
  if (!current) throw new NotFoundError('Pickup request not found');

  // Idempotent: if already in the target status, return current pickup cleanly
  if (current.status === input.status) {
    return toPickupResponse(current);
  }

  const allowedFrom = VALID_TRANSITIONS[input.status];
  if (!allowedFrom || !allowedFrom.includes(current.status)) {
    throw new ConflictError(
      `Cannot mark as '${input.status}' a pickup in '${current.status}' status`,
    );
  }

  const updated = await pickupRepo.updatePickupStatus(id, orgId, input.status);

  if (input.status === 'completed') {
    // Also sync any route stop pointing to this completed pickup
    if (typeof pickupRepo.syncRouteStopForPickup === 'function') {
      await Promise.resolve(pickupRepo.syncRouteStopForPickup(id, orgId, 'completed')).catch(() => {});
    }

    logAudit({
      organizationId: orgId,
      actorId,
      actorRole,
      action: 'pickup_completed',
      entityType: 'pickup_request',
      entityId: id,
    });
  }

  return toPickupResponse(updated!);
}

export async function getMyPickups(
  callerId: string,
  orgId: string,
  userRole?: string,
  userBusinessId?: string | null,
): Promise<PickupResponse[]> {
  if (userRole === 'business_user' && userBusinessId) {
    const rows = await pickupRepo.findPickupsByBusinessId(userBusinessId, orgId);
    return rows.map(toPickupResponse);
  }
  const rows = await pickupRepo.findPickupsByDriverId(callerId, orgId);
  return rows.map(toPickupResponse);
}

export async function cancelPickup(
  id: string,
  orgId: string,
  input: CancelPickupInput,
  actorId?: string,
  actorRole?: string,
): Promise<PickupResponse> {
  const current = await pickupRepo.findPickupByIdAndOrg(id, orgId);
  if (!current) throw new NotFoundError('Pickup request not found');

  const allowedFrom = VALID_TRANSITIONS['cancelled'];
  if (!allowedFrom.includes(current.status)) {
    throw new ConflictError(
      `Cannot cancel a pickup in '${current.status}' status`,
    );
  }

  const updated = await pickupRepo.updatePickupStatus(id, orgId, 'cancelled');
  if (!updated) throw new NotFoundError('Pickup request not found');

  logAudit({
    organizationId: orgId,
    actorId,
    actorRole,
    action: 'pickup_cancelled',
    entityType: 'pickup_request',
    entityId: id,
    metadata: { reason: input.reason ?? null },
  });

  return toPickupResponse(updated);
}

export async function getNearbyPickups(
  orgId: string,
  queryParams: NearbyPickupsQuery,
): Promise<PickupResponse[]> {
  const rows = await pickupRepo.findNearbyPickups(
    orgId,
    queryParams.lat,
    queryParams.lng,
    queryParams.radiusMeters,
  );
  return rows.map(toPickupResponse);
}

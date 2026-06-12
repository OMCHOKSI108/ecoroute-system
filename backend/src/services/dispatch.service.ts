import { withTransaction } from '../config/db';
import * as dispatchRepo from '../repositories/dispatch.repository';
import { ConflictError, NotFoundError } from '../types/errors';
import { toVehicleResponse, type VehicleResponse } from './vehicles.service';
import { toPickupResponse, type PickupResponse } from './pickups.service';
import { logAudit } from './audit.service';
import type { AssignDispatchInput, DispatchPreviewInput, AutoAssignInput } from '../schemas/dispatch.schemas';
import type { VehicleRow } from '../repositories/vehicles.repository';
import type { PickupRow } from '../repositories/pickups.repository';

export interface DispatchPreviewCandidate {
  vehicleId: string;
  plateNumber: string;
  model: string;
  capacityKg: number;
  currentLoadKg: number;
  availableCapacity: number;
  totalPickupWeight: number;
  pickupCount: number;
  fits: boolean;
}

export interface AutoAssignResult {
  assignments: { vehicleId: string; vehiclePlate: string; pickupIds: string[] }[];
  unassignedPickupIds: string[];
}

export async function dispatchPreview(
  input: DispatchPreviewInput,
  orgId: string,
): Promise<{ candidates: DispatchPreviewCandidate[]; totalWeight: number }> {
  const pickups = await dispatchRepo.findPickupsByIds(input.pickupIds, orgId);
  if (pickups.length !== input.pickupIds.length) {
    throw new NotFoundError('One or more pickup requests not found');
  }

  const totalWeight = pickups.reduce(
    (sum, p) => sum + (p.estimated_weight_kg !== null ? parseFloat(p.estimated_weight_kg) : 0),
    0,
  );

  const vehicles = await dispatchRepo.findAvailableVehicles(orgId);

  const candidates: DispatchPreviewCandidate[] = vehicles.map((v) => {
    const availableCapacity =
      parseFloat(v.capacity_kg) - parseFloat(v.current_load_kg);
    return {
      vehicleId: v.id,
      plateNumber: v.plate_number,
      model: v.model,
      capacityKg: parseFloat(v.capacity_kg),
      currentLoadKg: parseFloat(v.current_load_kg),
      availableCapacity,
      totalPickupWeight: totalWeight,
      pickupCount: pickups.length,
      fits: totalWeight <= availableCapacity,
    };
  });

  return { candidates, totalWeight };
}

export async function autoAssign(
  input: AutoAssignInput,
  orgId: string,
  actorId?: string,
  actorRole?: string,
): Promise<AutoAssignResult> {
  const assignments: { vehicleId: string; vehiclePlate: string; pickupIds: string[] }[] = [];
  const allUnassigned: string[] = [];

  const vehicles = await dispatchRepo.findAvailableVehicles(orgId);
  const pickups = await dispatchRepo.findUnassignedPendingPickups(orgId);

  if (vehicles.length === 0) {
    return { assignments: [], unassignedPickupIds: pickups.map((p) => p.id) };
  }
  if (pickups.length === 0) {
    return { assignments: [], unassignedPickupIds: [] };
  }

  let remainingPickups = [...pickups];
  const maxPerVehicle = input.maxPickupsPerVehicle;

  for (const vehicle of vehicles) {
    if (remainingPickups.length === 0) break;

    let availableCapacity =
      parseFloat(vehicle.capacity_kg) - parseFloat(vehicle.current_load_kg);
    const batch: PickupRow[] = [];
    const remaining: PickupRow[] = [];

    for (const pickup of remainingPickups) {
      const weight = pickup.estimated_weight_kg !== null ? parseFloat(pickup.estimated_weight_kg) : 0;

      if (
        batch.length < maxPerVehicle &&
        (input.maxWeightPerVehicle === undefined || weight <= availableCapacity)
      ) {
        if (weight <= availableCapacity) {
          batch.push(pickup);
          availableCapacity -= weight;
          continue;
        }
      }
      remaining.push(pickup);
    }

    if (batch.length > 0) {
      const pickupIds = batch.map((p) => p.id);

      await withTransaction(async (client) => {
        const updatedPickups = await dispatchRepo.assignPickupsToVehicle(
          client,
          pickupIds,
          vehicle.id,
        );
        if (updatedPickups.length > 0) {
          await dispatchRepo.updateVehicleDispatched(
            client,
            vehicle.id,
            batch.reduce((sum, p) => sum + (p.estimated_weight_kg !== null ? parseFloat(p.estimated_weight_kg) : 0), 0),
          );
        }
      });

      assignments.push({
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.plate_number,
        pickupIds,
      });

      const assignedIds = new Set(pickupIds);
      remainingPickups = remaining.filter((p) => !assignedIds.has(p.id));

      logAudit({
        organizationId: orgId,
        actorId,
        actorRole,
        action: 'auto_dispatch_assignment',
        entityType: 'vehicle',
        entityId: vehicle.id,
        metadata: { pickupIds, count: pickupIds.length, mode: 'auto' },
      });
    }
  }

  return {
    assignments,
    unassignedPickupIds: remainingPickups.map((p) => p.id),
  };
}

export interface AssignDispatchResult {
  vehicle: VehicleResponse;
  pickups: PickupResponse[];
}

export async function assignDispatch(
  input: AssignDispatchInput,
  orgId: string,
  actorId?: string,
  actorRole?: string,
): Promise<AssignDispatchResult> {
  return withTransaction(async (client) => {
    // 1. Lock the vehicle row to prevent concurrent dispatch
    const vehicle = await dispatchRepo.lockVehicle(client, input.vehicleId, orgId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (vehicle.status !== 'available') {
      throw new ConflictError(`Vehicle is not available for dispatch (status: '${vehicle.status}')`);
    }

    // 2. Lock all requested pickup rows to prevent concurrent assignment
    const pickups = await dispatchRepo.lockPickups(client, input.pickupIds, orgId);
    if (pickups.length !== input.pickupIds.length) {
      throw new NotFoundError('One or more pickup requests not found or not accessible');
    }

    // 3. Validate all pickups are pending and unassigned
    const nonPending = pickups.filter((p) => p.status !== 'pending');
    if (nonPending.length > 0) {
      throw new ConflictError(
        `One or more pickup requests are not in pending status: ${nonPending.map((p) => p.id).join(', ')}`,
      );
    }

    // 4. Capacity check — pickups with null weight contribute 0
    const totalWeight = pickups.reduce(
      (sum, p) => sum + (p.estimated_weight_kg !== null ? parseFloat(p.estimated_weight_kg) : 0),
      0,
    );
    const availableCapacity =
      parseFloat(vehicle.capacity_kg) - parseFloat(vehicle.current_load_kg);

    if (totalWeight > availableCapacity) {
      throw new ConflictError(
        `Insufficient capacity: need ${totalWeight.toFixed(2)} kg, available ${availableCapacity.toFixed(2)} kg`,
      );
    }

    // 5. Persist — both updates must succeed or the transaction rolls back
    const updatedVehicle = await dispatchRepo.updateVehicleDispatched(
      client,
      input.vehicleId,
      totalWeight,
    );
    const updatedPickups = await dispatchRepo.assignPickupsToVehicle(
      client,
      input.pickupIds,
      input.vehicleId,
    );
    if (updatedPickups.length !== input.pickupIds.length) {
      throw new ConflictError('One or more pickup requests were assigned by another dispatch');
    }

    const result = {
      vehicle: toVehicleResponse(updatedVehicle),
      pickups: updatedPickups.map(toPickupResponse),
    };

    logAudit({
      organizationId: orgId,
      actorId,
      actorRole,
      action: 'dispatch_assignment',
      entityType: 'vehicle',
      entityId: input.vehicleId,
      metadata: { pickupIds: input.pickupIds, totalPickups: input.pickupIds.length },
    });

    return result;
  });
}

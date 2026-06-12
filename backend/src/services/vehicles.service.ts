import * as vehicleRepo from '../repositories/vehicles.repository';
import { ConflictError, NotFoundError } from '../types/errors';
import type { CreateVehicleInput, UpdateVehicleStatusInput, AssignDriverInput, ListVehiclesQuery } from '../schemas/vehicles.schemas';

export interface VehicleResponse {
  id: string;
  organizationId: string;
  plateNumber: string;
  model: string;
  capacityKg: number;
  currentLoadKg: number;
  status: string;
  driverId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toVehicleResponse(row: vehicleRepo.VehicleRow): VehicleResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    plateNumber: row.plate_number,
    model: row.model,
    capacityKg: parseFloat(row.capacity_kg),
    currentLoadKg: parseFloat(row.current_load_kg),
    status: row.status,
    driverId: row.driver_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createVehicle(
  input: CreateVehicleInput,
  orgId: string,
): Promise<VehicleResponse> {
  const row = await vehicleRepo.createVehicle(input, orgId);
  return toVehicleResponse(row);
}

export async function listVehicles(
  orgId: string,
  queryParams: ListVehiclesQuery,
): Promise<{ data: VehicleResponse[]; total: number; page: number; limit: number }> {
  const { data, total } = await vehicleRepo.findVehiclesByOrg(orgId, {
    page: queryParams.page,
    limit: queryParams.limit,
    status: queryParams.status,
  });
  return { data: data.map(toVehicleResponse), total, page: queryParams.page, limit: queryParams.limit };
}

export async function getVehicleById(id: string, orgId: string): Promise<VehicleResponse> {
  const row = await vehicleRepo.findVehicleByIdAndOrg(id, orgId);
  if (!row) throw new NotFoundError('Vehicle not found');
  return toVehicleResponse(row);
}

export async function updateVehicleStatus(
  id: string,
  orgId: string,
  input: UpdateVehicleStatusInput,
): Promise<VehicleResponse> {
  const current = await vehicleRepo.findVehicleByIdAndOrg(id, orgId);
  if (!current) throw new NotFoundError('Vehicle not found');
  if (current.status === 'dispatched' || parseFloat(current.current_load_kg) > 0) {
    throw new ConflictError('Cannot manually change status for a dispatched or loaded vehicle');
  }
  const row = await vehicleRepo.updateVehicleStatus(id, orgId, input.status);
  if (!row) throw new NotFoundError('Vehicle not found');
  return toVehicleResponse(row);
}

export async function assignDriver(
  id: string,
  orgId: string,
  input: AssignDriverInput,
): Promise<VehicleResponse> {
  if (input.driverId !== null) {
    const exists = await vehicleRepo.driverExistsInOrg(input.driverId, orgId);
    if (!exists) throw new NotFoundError('Driver not found or not a driver in this organization');
  }
  const row = await vehicleRepo.assignDriver(id, orgId, input.driverId);
  if (!row) throw new NotFoundError('Vehicle not found');
  return toVehicleResponse(row);
}

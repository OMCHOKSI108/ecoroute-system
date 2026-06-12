import * as driverRepo from '../repositories/drivers.repository';
import * as vehicleRepo from '../repositories/vehicles.repository';
import { NotFoundError } from '../types/errors';
import type { Role } from '../types/auth';
import type { ListDriversQuery, UpdateDriverStatusInput } from '../schemas/drivers.schemas';
import type { UserRow } from '../repositories/auth.repository';
import type { VehicleRow } from '../repositories/vehicles.repository';

export interface DriverResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  driverStatus: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverWithVehicleResponse extends DriverResponse {
  assignedVehicle: VehicleRow | null;
}

function toDriverResponse(row: UserRow): DriverResponse {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    isActive: row.is_active,
    driverStatus: (row as { driver_status?: string }).driver_status ?? null,
    organizationId: row.organization_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listDrivers(
  orgId: string,
  queryParams: ListDriversQuery,
): Promise<{ data: DriverResponse[]; total: number; page: number; limit: number }> {
  const isActive = queryParams.isActive === undefined ? undefined : queryParams.isActive === 'true';
  const { data, total } = await driverRepo.findDriversByOrg(orgId, {
    page: queryParams.page,
    limit: queryParams.limit,
    driverStatus: queryParams.driverStatus,
    isActive,
  });
  return {
    data: data.map(toDriverResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}

export async function getDriverById(id: string, orgId: string): Promise<DriverWithVehicleResponse> {
  const row = await driverRepo.findDriverById(id, orgId);
  if (!row) throw new NotFoundError('Driver not found');

  const vehicles = await vehicleRepo.findVehiclesByOrg(orgId, { page: 1, limit: 1 });
  const assignedVehicle = vehicles.data.find(v => v.driver_id === id) ?? null;

  return { ...toDriverResponse(row), assignedVehicle };
}

export async function updateDriverStatus(
  id: string,
  orgId: string,
  input: UpdateDriverStatusInput,
): Promise<DriverResponse> {
  const row = await driverRepo.updateDriverStatus(id, orgId, input.driverStatus);
  if (!row) throw new NotFoundError('Driver not found');
  return toDriverResponse(row);
}

export async function assignVehicle(
  driverId: string,
  vehicleId: string,
  orgId: string,
): Promise<{ driver: DriverResponse; vehicleId: string }> {
  const driver = await driverRepo.findDriverById(driverId, orgId);
  if (!driver) throw new NotFoundError('Driver not found');

  const vehicle = await vehicleRepo.findVehicleByIdAndOrg(vehicleId, orgId);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  const updated = await vehicleRepo.assignDriver(vehicleId, orgId, driverId);
  if (!updated) throw new NotFoundError('Failed to assign driver to vehicle');

  return { driver: toDriverResponse(driver), vehicleId: updated.id };
}

export async function unassignVehicle(
  vehicleId: string,
  orgId: string,
): Promise<{ vehicleId: string }> {
  const vehicle = await vehicleRepo.findVehicleByIdAndOrg(vehicleId, orgId);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  await vehicleRepo.assignDriver(vehicleId, orgId, null);
  return { vehicleId };
}

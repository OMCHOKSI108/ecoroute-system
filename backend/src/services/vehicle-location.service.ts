import * as vlRepo from '../repositories/vehicle-location.repository';
import * as vehicleRepo from '../repositories/vehicles.repository';
import { NotFoundError } from '../types/errors';
import type { ReportLocationInput, ListLocationHistoryQuery } from '../schemas/vehicle-location.schemas';

export interface VehicleLocationResponse {
  vehicleId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
}

function toResponse(row: vlRepo.VehicleLocationLatestRow): VehicleLocationResponse {
  return {
    vehicleId: row.vehicle_id,
    latitude: row.latitude,
    longitude: row.longitude,
    recordedAt: row.recorded_at instanceof Date
      ? row.recorded_at.toISOString()
      : String(row.recorded_at),
  };
}

function toHistoryResponse(row: vlRepo.VehicleLocationRow): VehicleLocationResponse & { id: string } {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    latitude: row.latitude,
    longitude: row.longitude,
    recordedAt: row.recorded_at instanceof Date
      ? row.recorded_at.toISOString()
      : String(row.recorded_at),
  };
}

export async function reportLocation(
  vehicleId: string,
  orgId: string,
  input: ReportLocationInput,
): Promise<VehicleLocationResponse> {
  const vehicle = await vehicleRepo.findVehicleByIdAndOrg(vehicleId, orgId);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  const recordedAt = input.recordedAt ?? new Date().toISOString();

  await vlRepo.insertLocation(vehicleId, orgId, input.latitude, input.longitude, recordedAt);
  await vlRepo.upsertLatestLocation(vehicleId, orgId, input.latitude, input.longitude, recordedAt);

  return { vehicleId, latitude: input.latitude, longitude: input.longitude, recordedAt };
}

export async function getLatestLocation(
  vehicleId: string,
  orgId: string,
): Promise<VehicleLocationResponse> {
  const row = await vlRepo.findLatestLocation(vehicleId, orgId);
  if (!row) throw new NotFoundError('No location data for this vehicle');
  return toResponse(row);
}

export async function getAllLatestLocations(orgId: string): Promise<VehicleLocationResponse[]> {
  const rows = await vlRepo.findAllLatestLocations(orgId);
  return rows.map(toResponse);
}

export async function getLocationHistory(
  vehicleId: string,
  orgId: string,
  queryParams: ListLocationHistoryQuery,
): Promise<{ data: (VehicleLocationResponse & { id: string })[]; total: number; page: number; limit: number }> {
  const vehicle = await vehicleRepo.findVehicleByIdAndOrg(vehicleId, orgId);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  const { data, total } = await vlRepo.findLocationHistory(vehicleId, orgId, {
    from: queryParams.from,
    to: queryParams.to,
    page: queryParams.page,
    limit: queryParams.limit,
  });
  return {
    data: data.map(toHistoryResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}

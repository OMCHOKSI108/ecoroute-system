import * as routeStopRepo from '../repositories/route-stops.repository';
import * as pickupRepo from '../repositories/pickups.repository';
import { NotFoundError } from '../types/errors';
import type { ListRouteStopsQuery, UpdateRouteStopStatusInput } from '../schemas/route-stops.schemas';
import type { RouteStopRow } from '../repositories/route-stops.repository';

export interface RouteStopResponse {
  id: string;
  routeId: string;
  pickupId: string | null;
  pickupStatus?: string | null;
  stopOrder: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  plannedDistanceM: number | null;
  plannedDurationS: number | null;
  createdAt: string;
  updatedAt: string;
}

function toResponse(row: RouteStopRow): RouteStopResponse {
  return {
    id: row.id,
    routeId: row.route_id,
    pickupId: row.pickup_id,
    pickupStatus: (row as any).pickup_status ?? null,
    stopOrder: row.stop_order,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    plannedDistanceM: row.planned_distance_m !== null ? parseFloat(row.planned_distance_m) : null,
    plannedDurationS: row.planned_duration_s !== null ? parseFloat(row.planned_duration_s) : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listRouteStops(
  orgId: string,
  queryParams: ListRouteStopsQuery,
): Promise<{ data: RouteStopResponse[]; total: number; page: number; limit: number }> {
  const { data, total } = await routeStopRepo.findRouteStopsByOrg(orgId, {
    routeId: queryParams.routeId,
    status: queryParams.status,
    page: queryParams.page,
    limit: queryParams.limit,
  });
  return {
    data: data.map(toResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}

export async function getRouteStopById(id: string, orgId: string): Promise<RouteStopResponse> {
  const row = await routeStopRepo.findRouteStopById(id, orgId);
  if (!row) throw new NotFoundError('Route stop not found');
  return toResponse(row);
}

export async function updateRouteStopStatus(
  id: string,
  orgId: string,
  input: UpdateRouteStopStatusInput,
): Promise<RouteStopResponse> {
  const row = await routeStopRepo.updateRouteStopStatus(id, orgId, input.status);
  if (!row) throw new NotFoundError('Route stop not found');

  // When a stop is marked completed, automatically complete the attached pickup
  if (input.status === 'completed' && row.pickup_id) {
    if (typeof pickupRepo.updatePickupStatus === 'function') {
      await Promise.resolve(pickupRepo.updatePickupStatus(row.pickup_id, orgId, 'completed')).catch(() => {});
    }
  } else if (input.status === 'arrived' && row.pickup_id) {
    if (typeof pickupRepo.findPickupByIdAndOrg === 'function' && typeof pickupRepo.updatePickupStatus === 'function') {
      const pickup = await Promise.resolve(pickupRepo.findPickupByIdAndOrg(row.pickup_id, orgId)).catch(() => null);
      if (pickup && pickup.status === 'assigned') {
        await Promise.resolve(pickupRepo.updatePickupStatus(row.pickup_id, orgId, 'in_progress')).catch(() => {});
      }
    }
  }

  return toResponse(row);
}

export async function getRouteStopsByRouteId(
  routeId: string,
  orgId: string,
): Promise<RouteStopResponse[]> {
  const rows = await routeStopRepo.findRouteStopsByRouteId(routeId, orgId);
  return rows.map(toResponse);
}

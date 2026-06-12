import { withTransaction } from '../config/db';
import * as routesRepo from '../repositories/routes.repository';
import { osrmTrip } from '../clients/osrm.client';
import { logAudit } from './audit.service';
import { ConflictError, NotFoundError } from '../types/errors';
import type { GenerateRouteInput, ListRoutesQuery } from '../schemas/routes.schemas';
import type { RouteRow } from '../repositories/routes.repository';

export interface RouteResponse {
  id: string;
  organizationId: string;
  vehicleId: string;
  status: string;
  totalDistanceM: number;
  totalDurationS: number;
  geometry: unknown;
  waypoints: unknown;
  pickupCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toRouteResponse(row: RouteRow): RouteResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    vehicleId: row.vehicle_id,
    status: row.status,
    totalDistanceM: parseFloat(row.total_distance_m),
    totalDurationS: parseFloat(row.total_duration_s),
    geometry: row.geometry,
    waypoints: row.waypoints,
    pickupCount: row.pickup_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function generateRoute(
  input: GenerateRouteInput,
  orgId: string,
  actorId?: string,
  actorRole?: string,
): Promise<RouteResponse> {
  return withTransaction(async (client) => {
    const vehicle = await routesRepo.lockVehicleForRouteGeneration(client, input.vehicleId, orgId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (vehicle.status !== 'dispatched') {
      throw new ConflictError(`Vehicle is not dispatched (status: '${vehicle.status}')`);
    }

    const activeRoute = await routesRepo.findActiveRouteForVehicle(client, input.vehicleId, orgId);
    if (activeRoute) {
      throw new ConflictError('An active route already exists for this vehicle');
    }

    const pickups = await routesRepo.findAssignedPickupsWithLocations(input.vehicleId, orgId, client);
    if (pickups.length === 0) {
      throw new ConflictError('No assigned pickups found for this vehicle — dispatch first');
    }

    const tripResult = await osrmTrip(pickups.map((p) => ({ lat: p.lat, lng: p.lng })));
    const trip = tripResult.trips[0];
    if (!trip) {
      throw new Error('OSRM trip response did not include a route');
    }

    let route: RouteRow;
    try {
      route = await routesRepo.createRoute(client, {
        organizationId: orgId,
        vehicleId: input.vehicleId,
        totalDistanceM: trip.distance,
        totalDurationS: trip.duration,
        geometry: trip.geometry,
        waypoints: tripResult.waypoints,
        pickupCount: pickups.length,
        osrmData: tripResult,
      });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictError('An active route already exists for this vehicle');
      }
      throw err;
    }

    const updatedPickupCount = await routesRepo.setPickupsRouteId(
      client,
      pickups.map((p) => p.id),
      route.id,
    );
    if (updatedPickupCount !== pickups.length) {
      throw new ConflictError('One or more pickups are no longer assignable to this route');
    }

    logAudit({
      organizationId: orgId,
      actorId,
      actorRole,
      action: 'route_generated',
      entityType: 'route',
      entityId: route.id,
      metadata: { vehicleId: input.vehicleId, pickupCount: pickups.length },
    });

    return toRouteResponse(route);
  });
}

export async function listRoutes(
  orgId: string,
  queryParams: ListRoutesQuery,
): Promise<{ data: RouteResponse[]; total: number; page: number; limit: number }> {
  const { data, total } = await routesRepo.findRoutesByOrg(orgId, {
    vehicleId: queryParams.vehicleId,
    status: queryParams.status,
    page: queryParams.page,
    limit: queryParams.limit,
  });
  return {
    data: data.map(toRouteResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}

export async function getRouteById(id: string, orgId: string): Promise<RouteResponse> {
  const row = await routesRepo.findRouteByIdAndOrg(id, orgId);
  if (!row) throw new NotFoundError('Route not found');
  return toRouteResponse(row);
}

export async function completeRoute(
  id: string,
  orgId: string,
  actorId?: string,
  actorRole?: string,
): Promise<RouteResponse> {
  return withTransaction(async (client) => {
    const current = await routesRepo.lockRouteForUpdate(client, id, orgId);
    if (!current) throw new NotFoundError('Route not found');
    if (current.status !== 'active') {
      throw new ConflictError(`Cannot complete a route in '${current.status}' status`);
    }

    const route = await routesRepo.updateRouteStatus(client, id, orgId, 'completed');
    if (!route) throw new NotFoundError('Route not found');
    await routesRepo.completeVehicleAfterRoute(client, route.vehicle_id, orgId);
    await routesRepo.completePickupsForRoute(client, id);

    logAudit({
      organizationId: orgId,
      actorId,
      actorRole,
      action: 'route_completed',
      entityType: 'route',
      entityId: id,
      metadata: { vehicleId: route.vehicle_id },
    });

    return toRouteResponse(route);
  });
}

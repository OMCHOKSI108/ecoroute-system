import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db');
jest.mock('../src/repositories/routes.repository');
jest.mock('../src/clients/osrm.client');

import { withTransaction } from '../src/config/db';
import * as routesRepo from '../src/repositories/routes.repository';
import * as osrmClient from '../src/clients/osrm.client';
import { createApp } from '../src/app';
import type { RouteRow } from '../src/repositories/routes.repository';
import type { VehicleRow } from '../src/repositories/vehicles.repository';

const mockWithTransaction = withTransaction as jest.Mock;
const mockLockVehicleForRoute = routesRepo.lockVehicleForRouteGeneration as jest.Mock;
const mockFindActiveRoute = routesRepo.findActiveRouteForVehicle as jest.Mock;
const mockFindPickupsWithLocations = routesRepo.findAssignedPickupsWithLocations as jest.Mock;
const mockCreateRoute = routesRepo.createRoute as jest.Mock;
const mockSetPickupsRouteId = routesRepo.setPickupsRouteId as jest.Mock;
const mockFindRouteById = routesRepo.findRouteByIdAndOrg as jest.Mock;
const mockLockRouteForUpdate = routesRepo.lockRouteForUpdate as jest.Mock;
const mockFindRoutes = routesRepo.findRoutesByOrg as jest.Mock;
const mockUpdateRouteStatus = routesRepo.updateRouteStatus as jest.Mock;
const mockCompleteVehicle = routesRepo.completeVehicleAfterRoute as jest.Mock;
const mockCompletePickups = routesRepo.completePickupsForRoute as jest.Mock;
const mockOsrmTrip = osrmClient.osrmTrip as jest.Mock;

const app = createApp();
const mockClient = {};

function makeToken(role: 'admin' | 'dispatcher' | 'driver' = 'admin') {
  return jwt.sign(
    { sub: 'user-uuid', orgId: 'org-uuid', role, email: 'test@test.com' },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' },
  );
}

const dispatchedVehicle: VehicleRow = {
  id: 'veh-uuid',
  organization_id: 'org-uuid',
  plate_number: 'GJ01AA1234',
  model: 'Tata ACE',
  capacity_kg: '1000.00',
  current_load_kg: '200.00',
  status: 'dispatched',
  driver_id: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

const pickupsWithLocations: routesRepo.PickupWithLocation[] = [
  { id: 'p1-uuid', lat: 21.17, lng: 72.83 },
  { id: 'p2-uuid', lat: 21.18, lng: 72.84 },
];

const osrmResult: osrmClient.OsrmTripResult = {
  code: 'Ok',
  trips: [{ distance: 5000, duration: 600, geometry: { type: 'LineString', coordinates: [] }, legs: [] }],
  waypoints: [
    { name: '', location: [72.83, 21.17], trips_index: 0, waypoint_index: 0 },
    { name: '', location: [72.84, 21.18], trips_index: 0, waypoint_index: 1 },
  ],
};

const mockRouteRow: RouteRow = {
  id: 'route-uuid',
  organization_id: 'org-uuid',
  vehicle_id: 'veh-uuid',
  status: 'active',
  total_distance_m: '5000.00',
  total_duration_s: '600.00',
  geometry: { type: 'LineString', coordinates: [] },
  waypoints: [],
  pickup_count: 2,
  osrm_data: {},
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

  beforeEach(() => {
    jest.resetAllMocks();
    mockWithTransaction.mockImplementation(
      (fn: (client: unknown) => Promise<unknown>) => fn(mockClient),
    );
    mockFindActiveRoute.mockResolvedValue(null);
  });

// ─── POST /routes/generate ─────────────────────────────────────────────────

describe('POST /api/v1/routes/generate', () => {
  const validBody = { vehicleId: 'a0000000-0000-4000-8000-000000000001' };

  it('returns 201 with route on success', async () => {
    mockLockVehicleForRoute.mockResolvedValue(dispatchedVehicle);
    mockFindPickupsWithLocations.mockResolvedValue(pickupsWithLocations);
    mockOsrmTrip.mockResolvedValue(osrmResult);
    mockCreateRoute.mockResolvedValue(mockRouteRow);
    mockSetPickupsRouteId.mockResolvedValue(2);

    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('active');
    expect(res.body.totalDistanceM).toBe(5000);
    expect(res.body.totalDurationS).toBe(600);
    expect(res.body.pickupCount).toBe(2);
  });

  it('returns 400 for non-UUID vehicleId', async () => {
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ vehicleId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing vehicleId', async () => {
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).post('/api/v1/routes/generate').send(validBody);
    expect(res.status).toBe(401);
  });

  it('returns 403 for driver role', async () => {
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken('driver')}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it('returns 404 when vehicle not found', async () => {
    mockLockVehicleForRoute.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(404);
  });

  it('returns 409 when vehicle is not dispatched', async () => {
    mockLockVehicleForRoute.mockResolvedValue({ ...dispatchedVehicle, status: 'available' });
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/not dispatched/i);
  });

  it('returns 409 when an active route already exists for the vehicle', async () => {
    mockLockVehicleForRoute.mockResolvedValue(dispatchedVehicle);
    mockFindActiveRoute.mockResolvedValue(mockRouteRow);
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/active route/i);
  });

  it('returns 409 when no assigned pickups exist', async () => {
    mockLockVehicleForRoute.mockResolvedValue(dispatchedVehicle);
    mockFindPickupsWithLocations.mockResolvedValue([]);
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/no assigned pickups/i);
  });

  it('returns 500 when OSRM call fails', async () => {
    mockLockVehicleForRoute.mockResolvedValue(dispatchedVehicle);
    mockFindPickupsWithLocations.mockResolvedValue(pickupsWithLocations);
    mockOsrmTrip.mockRejectedValue(new Error('OSRM trip failed with code: NoTrips'));
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(500);
  });

  it('returns 409 when pickups become unassignable during route persistence', async () => {
    mockLockVehicleForRoute.mockResolvedValue(dispatchedVehicle);
    mockFindPickupsWithLocations.mockResolvedValue(pickupsWithLocations);
    mockOsrmTrip.mockResolvedValue(osrmResult);
    mockCreateRoute.mockResolvedValue(mockRouteRow);
    mockSetPickupsRouteId.mockResolvedValue(1);
    const res = await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/no longer assignable/i);
  });

  it('calls osrmTrip with correct lng,lat coordinate order', async () => {
    mockLockVehicleForRoute.mockResolvedValue(dispatchedVehicle);
    mockFindPickupsWithLocations.mockResolvedValue(pickupsWithLocations);
    mockOsrmTrip.mockResolvedValue(osrmResult);
    mockCreateRoute.mockResolvedValue(mockRouteRow);
    mockSetPickupsRouteId.mockResolvedValue(2);

    await request(app)
      .post('/api/v1/routes/generate')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);

    expect(mockOsrmTrip).toHaveBeenCalledWith([
      { lat: 21.17, lng: 72.83 },
      { lat: 21.18, lng: 72.84 },
    ]);
  });
});

// ─── GET /routes ───────────────────────────────────────────────────────────

describe('GET /api/v1/routes', () => {
  it('returns 200 with paginated list', async () => {
    mockFindRoutes.mockResolvedValue({ data: [mockRouteRow], total: 1 });
    const res = await request(app)
      .get('/api/v1/routes')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('passes status filter to repository', async () => {
    mockFindRoutes.mockResolvedValue({ data: [], total: 0 });
    await request(app)
      .get('/api/v1/routes?status=active')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(mockFindRoutes).toHaveBeenCalledWith('org-uuid', expect.objectContaining({ status: 'active' }));
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/routes');
    expect(res.status).toBe(401);
  });
});

// ─── GET /routes/:id ───────────────────────────────────────────────────────

describe('GET /api/v1/routes/:id', () => {
  it('returns 200 when found', async () => {
    mockFindRouteById.mockResolvedValue(mockRouteRow);
    const res = await request(app)
      .get('/api/v1/routes/route-uuid')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('route-uuid');
    expect(res.body.vehicleId).toBe('veh-uuid');
  });

  it('returns 404 when not found', async () => {
    mockFindRouteById.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/v1/routes/missing-uuid')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /routes/:id/status ──────────────────────────────────────────────

describe('PATCH /api/v1/routes/:id/status', () => {
  it('completes an active route', async () => {
    mockLockRouteForUpdate.mockResolvedValue(mockRouteRow);
    mockUpdateRouteStatus.mockResolvedValue({ ...mockRouteRow, status: 'completed' });
    mockCompleteVehicle.mockResolvedValue(undefined);
    mockCompletePickups.mockResolvedValue(undefined);

    const res = await request(app)
      .patch('/api/v1/routes/route-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('returns 400 when status is not "completed"', async () => {
    const res = await request(app)
      .patch('/api/v1/routes/route-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'active' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when route not found', async () => {
    mockLockRouteForUpdate.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/v1/routes/missing/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(404);
  });

  it('returns 409 when route is already completed', async () => {
    mockLockRouteForUpdate.mockResolvedValue({ ...mockRouteRow, status: 'completed' });
    const res = await request(app)
      .patch('/api/v1/routes/route-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(409);
  });

  it('resets vehicle to available and completes pickups on success', async () => {
    mockLockRouteForUpdate.mockResolvedValue(mockRouteRow);
    mockUpdateRouteStatus.mockResolvedValue({ ...mockRouteRow, status: 'completed' });
    mockCompleteVehicle.mockResolvedValue(undefined);
    mockCompletePickups.mockResolvedValue(undefined);

    await request(app)
      .patch('/api/v1/routes/route-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'completed' });

    expect(mockCompleteVehicle).toHaveBeenCalledWith(mockClient, 'veh-uuid', 'org-uuid');
    expect(mockCompletePickups).toHaveBeenCalledWith(mockClient, 'route-uuid');
  });
});

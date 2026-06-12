import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db');
jest.mock('../src/repositories/dashboard.repository');

import * as dashRepo from '../src/repositories/dashboard.repository';
import { createApp } from '../src/app';

const mockFleet = dashRepo.getFleetSummary as jest.Mock;
const mockPickupSummary = dashRepo.getPickupSummary as jest.Mock;
const mockRouteSummary = dashRepo.getRouteSummary as jest.Mock;
const mockVehicleWorkloads = dashRepo.getVehicleWorkloads as jest.Mock;
const mockPickupByStatus = dashRepo.getPickupStatsByStatus as jest.Mock;
const mockPickupByCategory = dashRepo.getPickupStatsByCategory as jest.Mock;
const mockTodayStats = dashRepo.getTodayPickupStats as jest.Mock;

const app = createApp();

function makeToken(role: 'admin' | 'dispatcher' | 'driver' = 'admin') {
  return jwt.sign(
    { sub: 'user-uuid', orgId: 'org-uuid', role, email: 'test@test.com' },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' },
  );
}

const fleetData = { total: 5, available: 3, dispatched: 1, maintenance: 1, offline: 0 };
const pickupData = { pending: 10, assigned: 3, in_progress: 2, completed_today: 8, cancelled_today: 1 };
const routeData = { active: 1, completed_today: 4 };

beforeEach(() => jest.resetAllMocks());

// ─── GET /dashboard/summary ────────────────────────────────────────────────

describe('GET /api/v1/dashboard/summary', () => {
  it('returns 200 with fleet, pickups, and routes summary', async () => {
    mockFleet.mockResolvedValue(fleetData);
    mockPickupSummary.mockResolvedValue(pickupData);
    mockRouteSummary.mockResolvedValue(routeData);

    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.fleet.total).toBe(5);
    expect(res.body.fleet.available).toBe(3);
    expect(res.body.pickups.pending).toBe(10);
    expect(res.body.routes.active).toBe(1);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(res.status).toBe(401);
  });

  it('returns 403 for driver role', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${makeToken('driver')}`);
    expect(res.status).toBe(403);
  });

  it('is accessible for dispatcher role', async () => {
    mockFleet.mockResolvedValue(fleetData);
    mockPickupSummary.mockResolvedValue(pickupData);
    mockRouteSummary.mockResolvedValue(routeData);
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${makeToken('dispatcher')}`);
    expect(res.status).toBe(200);
  });
});

// ─── GET /dashboard/vehicles ───────────────────────────────────────────────

describe('GET /api/v1/dashboard/vehicles', () => {
  const vehicleWorkloadRow: dashRepo.VehicleWorkload = {
    vehicle_id: 'veh-uuid',
    plate_number: 'GJ01AA1234',
    model: 'Tata ACE',
    status: 'dispatched',
    capacity_kg: '1000.00',
    current_load_kg: '200.00',
    assigned_pickup_count: 3,
  };

  it('returns 200 with vehicle workloads and utilization pct', async () => {
    mockVehicleWorkloads.mockResolvedValue([vehicleWorkloadRow]);

    const res = await request(app)
      .get('/api/v1/dashboard/vehicles')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].plateNumber).toBe('GJ01AA1234');
    expect(res.body.data[0].capacityKg).toBe(1000);
    expect(res.body.data[0].currentLoadKg).toBe(200);
    expect(res.body.data[0].utilizationPct).toBe(20);
    expect(res.body.data[0].assignedPickupCount).toBe(3);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/dashboard/vehicles');
    expect(res.status).toBe(401);
  });
});

// ─── GET /dashboard/pickups ────────────────────────────────────────────────

describe('GET /api/v1/dashboard/pickups', () => {
  it('returns 200 with byStatus, byCategory, and today', async () => {
    mockPickupByStatus.mockResolvedValue([
      { status: 'pending', count: 10 },
      { status: 'completed', count: 45 },
    ]);
    mockPickupByCategory.mockResolvedValue([{ waste_category: 'plastic', count: 30 }]);
    mockTodayStats.mockResolvedValue({ created: 5, completed: 3, cancelled: 1 });

    const res = await request(app)
      .get('/api/v1/dashboard/pickups')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.byStatus.pending).toBe(10);
    expect(res.body.byStatus.completed).toBe(45);
    expect(res.body.byCategory[0].waste_category).toBe('plastic');
    expect(res.body.today.created).toBe(5);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/dashboard/pickups');
    expect(res.status).toBe(401);
  });
});

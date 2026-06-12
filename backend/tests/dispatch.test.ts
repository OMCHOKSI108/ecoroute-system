import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db');
jest.mock('../src/repositories/dispatch.repository');

import { withTransaction } from '../src/config/db';
import * as dispatchRepo from '../src/repositories/dispatch.repository';
import { createApp } from '../src/app';
import type { VehicleRow } from '../src/repositories/vehicles.repository';
import type { PickupRow } from '../src/repositories/pickups.repository';

const mockWithTransaction = withTransaction as jest.Mock;
const mockLockVehicle = dispatchRepo.lockVehicle as jest.Mock;
const mockLockPickups = dispatchRepo.lockPickups as jest.Mock;
const mockUpdateVehicle = dispatchRepo.updateVehicleDispatched as jest.Mock;
const mockAssignPickups = dispatchRepo.assignPickupsToVehicle as jest.Mock;

const app = createApp();
const mockClient = {};

function makeToken(role: 'admin' | 'dispatcher' = 'admin') {
  return jwt.sign(
    { sub: 'user-uuid', orgId: 'org-uuid', role, email: 'test@test.com' },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' },
  );
}

const availableVehicle: VehicleRow = {
  id: 'veh-uuid',
  organization_id: 'org-uuid',
  plate_number: 'GJ01AA1234',
  model: 'Tata ACE',
  capacity_kg: '1000.00',
  current_load_kg: '0.00',
  status: 'available',
  driver_id: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

const pendingPickup = (id: string, weightKg = '50.00'): PickupRow => ({
  id,
  organization_id: 'org-uuid',
  business_id: 'biz-uuid',
  assigned_vehicle_id: null,
  requested_by: 'user-uuid',
  status: 'pending',
  scheduled_at: null,
  notes: null,
  waste_category: 'plastic',
  estimated_weight_kg: weightKg,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
});

const validBody = {
  vehicleId: 'a0000000-0000-4000-8000-000000000001',
  pickupIds: ['b0000000-0000-4000-8000-000000000001'],
};

beforeEach(() => {
  jest.resetAllMocks();
  // Make withTransaction execute the callback immediately with a mock client
  mockWithTransaction.mockImplementation(
    (fn: (client: unknown) => Promise<unknown>) => fn(mockClient),
  );
});

// ─── POST /dispatch/assign ─────────────────────────────────────────────────

describe('POST /api/v1/dispatch/assign', () => {
  it('returns 200 with updated vehicle and pickups on success', async () => {
    const pickup = pendingPickup('b0000000-0000-4000-8000-000000000001');
    mockLockVehicle.mockResolvedValue(availableVehicle);
    mockLockPickups.mockResolvedValue([pickup]);
    mockUpdateVehicle.mockResolvedValue({ ...availableVehicle, status: 'dispatched', current_load_kg: '50.00' });
    mockAssignPickups.mockResolvedValue([{ ...pickup, status: 'assigned', assigned_vehicle_id: 'veh-uuid' }]);

    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.vehicle.status).toBe('dispatched');
    expect(res.body.pickups).toHaveLength(1);
    expect(res.body.pickups[0].status).toBe('assigned');
  });

  it('returns 400 for empty pickupIds array', async () => {
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ vehicleId: validBody.vehicleId, pickupIds: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-UUID vehicleId', async () => {
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ vehicleId: 'not-a-uuid', pickupIds: validBody.pickupIds });
    expect(res.status).toBe(400);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .send(validBody);
    expect(res.status).toBe(401);
  });

  it('returns 404 when vehicle not found', async () => {
    mockLockVehicle.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(404);
  });

  it('returns 409 when vehicle is not available (dispatched)', async () => {
    mockLockVehicle.mockResolvedValue({ ...availableVehicle, status: 'dispatched' });
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
  });

  it('returns 404 when one pickup ID is not found', async () => {
    mockLockVehicle.mockResolvedValue(availableVehicle);
    // Two IDs requested but only one row returned
    mockLockPickups.mockResolvedValue([pendingPickup('b0000000-0000-4000-8000-000000000001')]);
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        vehicleId: validBody.vehicleId,
        pickupIds: [
          'b0000000-0000-4000-8000-000000000001',
          'b0000000-0000-4000-8000-000000000002',
        ],
      });
    expect(res.status).toBe(404);
  });

  it('returns 409 when a pickup is already assigned (not pending)', async () => {
    mockLockVehicle.mockResolvedValue(availableVehicle);
    mockLockPickups.mockResolvedValue([
      { ...pendingPickup('b0000000-0000-4000-8000-000000000001'), status: 'assigned' },
    ]);
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
  });

  it('returns 409 when a pickup is assigned between validation and update', async () => {
    const pickup = pendingPickup('b0000000-0000-4000-8000-000000000001');
    mockLockVehicle.mockResolvedValue(availableVehicle);
    mockLockPickups.mockResolvedValue([pickup]);
    mockUpdateVehicle.mockResolvedValue({ ...availableVehicle, status: 'dispatched', current_load_kg: '50.00' });
    mockAssignPickups.mockResolvedValue([]);
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/assigned by another dispatch/i);
  });

  it('returns 409 when total weight exceeds available capacity', async () => {
    // Vehicle: capacity=100, load=50 → available=50. Pickup: weight=60 → exceeds.
    const tightVehicle: VehicleRow = { ...availableVehicle, capacity_kg: '100.00', current_load_kg: '50.00' };
    const heavyPickup = pendingPickup('b0000000-0000-4000-8000-000000000001', '60.00');
    mockLockVehicle.mockResolvedValue(tightVehicle);
    mockLockPickups.mockResolvedValue([heavyPickup]);
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/capacity/i);
  });

  it('passes at exact capacity boundary (weight === availableCapacity)', async () => {
    // Vehicle: capacity=100, load=50 → available=50. Pickup: weight=50 → exactly fits.
    const tightVehicle: VehicleRow = { ...availableVehicle, capacity_kg: '100.00', current_load_kg: '50.00' };
    const exactPickup = pendingPickup('b0000000-0000-4000-8000-000000000001', '50.00');
    mockLockVehicle.mockResolvedValue(tightVehicle);
    mockLockPickups.mockResolvedValue([exactPickup]);
    mockUpdateVehicle.mockResolvedValue({ ...tightVehicle, status: 'dispatched', current_load_kg: '100.00' });
    mockAssignPickups.mockResolvedValue([{ ...exactPickup, status: 'assigned' }]);
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(200);
  });
});

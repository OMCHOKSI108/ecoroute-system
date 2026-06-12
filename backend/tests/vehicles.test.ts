import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db');
jest.mock('../src/repositories/vehicles.repository');

import * as vehicleRepo from '../src/repositories/vehicles.repository';
import { ConflictError } from '../src/types/errors';
import { createApp } from '../src/app';

const mockCreate = vehicleRepo.createVehicle as jest.Mock;
const mockList = vehicleRepo.findVehiclesByOrg as jest.Mock;
const mockFindOne = vehicleRepo.findVehicleByIdAndOrg as jest.Mock;
const mockUpdateStatus = vehicleRepo.updateVehicleStatus as jest.Mock;
const mockAssignDriver = vehicleRepo.assignDriver as jest.Mock;
const mockDriverExists = vehicleRepo.driverExistsInOrg as jest.Mock;

const app = createApp();

function makeToken(role: 'admin' | 'dispatcher' | 'driver' = 'admin') {
  return jwt.sign(
    { sub: 'user-uuid', orgId: 'org-uuid', role, email: 'test@test.com' },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' },
  );
}

const mockVehicleRow: vehicleRepo.VehicleRow = {
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

beforeEach(() => jest.resetAllMocks());

// ─── POST /vehicles ────────────────────────────────────────────────────────

describe('POST /api/v1/vehicles', () => {
  const validBody = { plateNumber: 'GJ01AA1234', model: 'Tata ACE', capacityKg: 1000 };

  it('returns 201 for admin', async () => {
    mockCreate.mockResolvedValue(mockVehicleRow);
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.plateNumber).toBe('GJ01AA1234');
    expect(res.body.capacityKg).toBe(1000);
  });

  it('returns 403 for dispatcher role', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${makeToken('dispatcher')}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).post('/api/v1/vehicles').send(validBody);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ model: 'Tata ACE' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-positive capacityKg', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody, capacityKg: -50 });
    expect(res.status).toBe(400);
  });

  it('returns 409 when plate number already exists in org', async () => {
    mockCreate.mockRejectedValue(new ConflictError("Plate number 'GJ01AA1234' already registered"));
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(409);
  });
});

// ─── GET /vehicles ─────────────────────────────────────────────────────────

describe('GET /api/v1/vehicles', () => {
  it('returns 200 with list for admin', async () => {
    mockList.mockResolvedValue({ data: [mockVehicleRow], total: 1 });
    const res = await request(app)
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${makeToken('admin')}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('returns 200 with list for dispatcher', async () => {
    mockList.mockResolvedValue({ data: [mockVehicleRow], total: 1 });
    const res = await request(app)
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${makeToken('dispatcher')}`);
    expect(res.status).toBe(200);
  });

  it('returns 403 for driver role', async () => {
    const res = await request(app)
      .get('/api/v1/vehicles')
      .set('Authorization', `Bearer ${makeToken('driver')}`);
    expect(res.status).toBe(403);
  });

  it('passes status filter through to repository', async () => {
    mockList.mockResolvedValue({ data: [], total: 0 });
    await request(app)
      .get('/api/v1/vehicles?status=available')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(mockList).toHaveBeenCalledWith('org-uuid', expect.objectContaining({ status: 'available' }));
  });
});

// ─── GET /vehicles/:id ─────────────────────────────────────────────────────

describe('GET /api/v1/vehicles/:id', () => {
  it('returns 200 when found', async () => {
    mockFindOne.mockResolvedValue(mockVehicleRow);
    const res = await request(app)
      .get('/api/v1/vehicles/veh-uuid')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('veh-uuid');
  });

  it('returns 404 when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/v1/vehicles/unknown-uuid')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /vehicles/:id/status ────────────────────────────────────────────

  describe('PATCH /api/v1/vehicles/:id/status', () => {
    it('returns 200 for valid status change', async () => {
      mockFindOne.mockResolvedValue(mockVehicleRow);
      mockUpdateStatus.mockResolvedValue({ ...mockVehicleRow, status: 'maintenance' });
    const res = await request(app)
      .patch('/api/v1/vehicles/veh-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'maintenance' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('maintenance');
  });

  it('returns 400 if status is "dispatched" (schema rejects it)', async () => {
    const res = await request(app)
      .patch('/api/v1/vehicles/veh-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'dispatched' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when vehicle not found', async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/v1/vehicles/unknown/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'available' });
    expect(res.status).toBe(404);
  });

  it('returns 409 when manually changing a dispatched vehicle status', async () => {
    mockFindOne.mockResolvedValue({
      ...mockVehicleRow,
      status: 'dispatched',
      current_load_kg: '50.00',
    });
    const res = await request(app)
      .patch('/api/v1/vehicles/veh-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'available' });
    expect(res.status).toBe(409);
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });
});

// ─── POST /vehicles/:id/driver ─────────────────────────────────────────────

describe('POST /api/v1/vehicles/:id/driver', () => {
  it('assigns a driver for admin', async () => {
    mockDriverExists.mockResolvedValue(true);
    mockAssignDriver.mockResolvedValue({ ...mockVehicleRow, driver_id: 'drv-uuid' });
    const res = await request(app)
      .post('/api/v1/vehicles/veh-uuid/driver')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ driverId: 'a0000000-0000-4000-8000-000000000001' });
    expect(res.status).toBe(200);
  });

  it('unassigns a driver when driverId is null', async () => {
    mockAssignDriver.mockResolvedValue({ ...mockVehicleRow, driver_id: null });
    const res = await request(app)
      .post('/api/v1/vehicles/veh-uuid/driver')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ driverId: null });
    expect(res.status).toBe(200);
    expect(res.body.driverId).toBeNull();
  });

  it('returns 403 for dispatcher role', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles/veh-uuid/driver')
      .set('Authorization', `Bearer ${makeToken('dispatcher')}`)
      .send({ driverId: null });
    expect(res.status).toBe(403);
  });

  it('returns 404 when driver does not exist in org', async () => {
    mockDriverExists.mockResolvedValue(false);
    const res = await request(app)
      .post('/api/v1/vehicles/veh-uuid/driver')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ driverId: 'a0000000-0000-4000-8000-000000000001' });
    expect(res.status).toBe(404);
  });
});

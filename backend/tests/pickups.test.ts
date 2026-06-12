import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db');
jest.mock('../src/repositories/pickups.repository');

import * as pickupRepo from '../src/repositories/pickups.repository';
import { createApp } from '../src/app';

const mockCreate = pickupRepo.createPickup as jest.Mock;
const mockList = pickupRepo.findPickupsByOrg as jest.Mock;
const mockFindOne = pickupRepo.findPickupByIdAndOrg as jest.Mock;
const mockUpdateStatus = pickupRepo.updatePickupStatus as jest.Mock;
const mockNearby = pickupRepo.findNearbyPickups as jest.Mock;

const app = createApp();

function makeToken(role: 'admin' | 'dispatcher' | 'driver' = 'admin') {
  return jwt.sign(
    { sub: 'user-uuid', orgId: 'org-uuid', role, email: 'test@test.com' },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' },
  );
}

const mockPickupRow: pickupRepo.PickupRow = {
  id: 'pickup-uuid',
  organization_id: 'org-uuid',
  business_id: 'biz-uuid',
  assigned_vehicle_id: null,
  requested_by: 'user-uuid',
  status: 'pending',
  scheduled_at: null,
  notes: null,
  waste_category: 'plastic',
  estimated_weight_kg: '50.00',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

beforeEach(() => jest.resetAllMocks());

// ─── POST /pickups ─────────────────────────────────────────────────────────

describe('POST /api/v1/pickups', () => {
  const validBody = {
    businessId: 'a0000000-0000-4000-8000-000000000001',
    wasteCategory: 'plastic',
    estimatedWeightKg: 50,
  };

  it('returns 201 for admin', async () => {
    mockCreate.mockResolvedValue(mockPickupRow);
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.wasteCategory).toBe('plastic');
  });

  it('returns 201 for dispatcher', async () => {
    mockCreate.mockResolvedValue(mockPickupRow);
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${makeToken('dispatcher')}`)
      .send(validBody);
    expect(res.status).toBe(201);
  });

  it('returns 403 for driver role', async () => {
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${makeToken('driver')}`)
      .send(validBody);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid businessId (not a UUID)', async () => {
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody, businessId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative weight', async () => {
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody, estimatedWeightKg: -10 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when business not found in org', async () => {
    mockCreate.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody);
    expect(res.status).toBe(404);
  });
});

// ─── GET /pickups ──────────────────────────────────────────────────────────

describe('GET /api/v1/pickups', () => {
  it('returns 200 with paginated list', async () => {
    mockList.mockResolvedValue({ data: [mockPickupRow], total: 1 });
    const res = await request(app)
      .get('/api/v1/pickups')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
  });

  it('passes status filter to repository', async () => {
    mockList.mockResolvedValue({ data: [], total: 0 });
    await request(app)
      .get('/api/v1/pickups?status=pending')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(mockList).toHaveBeenCalledWith('org-uuid', expect.objectContaining({ status: 'pending' }));
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/pickups');
    expect(res.status).toBe(401);
  });
});

// ─── GET /pickups/nearby ───────────────────────────────────────────────────

describe('GET /api/v1/pickups/nearby', () => {
  it('returns 200 with nearby pickups', async () => {
    mockNearby.mockResolvedValue([mockPickupRow]);
    const res = await request(app)
      .get('/api/v1/pickups/nearby?lat=21.17&lng=72.83')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 400 when lat is missing', async () => {
    const res = await request(app)
      .get('/api/v1/pickups/nearby?lng=72.83')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('returns 400 when lat is out of range', async () => {
    const res = await request(app)
      .get('/api/v1/pickups/nearby?lat=200&lng=72.83')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('"nearby" is not swallowed as an :id param — responds with array not 404', async () => {
    mockNearby.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/v1/pickups/nearby?lat=21.17&lng=72.83')
      .set('Authorization', `Bearer ${makeToken()}`);
    // If /nearby was matched as /:id, the service would call findPickupByIdAndOrg and return 404
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── GET /pickups/:id ──────────────────────────────────────────────────────

describe('GET /api/v1/pickups/:id', () => {
  it('returns 200 when found', async () => {
    mockFindOne.mockResolvedValue(mockPickupRow);
    const res = await request(app)
      .get('/api/v1/pickups/pickup-uuid')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('pickup-uuid');
  });

  it('returns 404 when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/v1/pickups/missing')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /pickups/:id/status ─────────────────────────────────────────────

describe('PATCH /api/v1/pickups/:id/status', () => {
  it('cancels a pending pickup', async () => {
    mockFindOne.mockResolvedValue({ ...mockPickupRow, status: 'pending' });
    mockUpdateStatus.mockResolvedValue({ ...mockPickupRow, status: 'cancelled' });
    const res = await request(app)
      .patch('/api/v1/pickups/pickup-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('completes an in_progress pickup', async () => {
    mockFindOne.mockResolvedValue({ ...mockPickupRow, status: 'in_progress' });
    mockUpdateStatus.mockResolvedValue({ ...mockPickupRow, status: 'completed' });
    const res = await request(app)
      .patch('/api/v1/pickups/pickup-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('cancels an assigned pickup', async () => {
    mockFindOne.mockResolvedValue({ ...mockPickupRow, status: 'assigned' });
    mockUpdateStatus.mockResolvedValue({ ...mockPickupRow, status: 'cancelled' });
    const res = await request(app)
      .patch('/api/v1/pickups/pickup-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('returns 409 when trying to complete a pending pickup', async () => {
    mockFindOne.mockResolvedValue({ ...mockPickupRow, status: 'pending' });
    const res = await request(app)
      .patch('/api/v1/pickups/pickup-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(409);
  });

  it('returns 400 when status is "assigned" (schema rejects it)', async () => {
    const res = await request(app)
      .patch('/api/v1/pickups/pickup-uuid/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'assigned' });
    expect(res.status).toBe(400);
  });
});

import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/db');
jest.mock('../src/repositories/businesses.repository');

import * as businessRepo from '../src/repositories/businesses.repository';
import { createApp } from '../src/app';

const mockCreate = businessRepo.createBusiness as jest.Mock;
const mockList = businessRepo.findBusinessesByOrg as jest.Mock;
const mockFindOne = businessRepo.findBusinessByIdAndOrg as jest.Mock;

const app = createApp();

// Generate a real JWT signed with the secret from the real .env
function makeToken(role: 'admin' | 'dispatcher' | 'driver' = 'admin') {
  return jwt.sign(
    { sub: 'user-uuid', orgId: 'org-uuid', role, email: 'test@test.com' },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' },
  );
}

const mockBusinessRow: businessRepo.BusinessRow = {
  id: 'biz-uuid',
  organization_id: 'org-uuid',
  name: 'Green Recyclers',
  address: '123 Main St',
  latitude: 21.17,
  longitude: 72.83,
  contact_email: 'contact@green.com',
  contact_phone: null,
  waste_categories: ['plastic', 'metal'],
  is_active: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ─── POST /businesses ──────────────────────────────────────────────────────

describe('POST /api/v1/businesses', () => {
  const validBody = {
    name: 'Green Recyclers',
    address: '123 Main St, Surat',
    latitude: 21.17,
    longitude: 72.83,
    contactEmail: 'contact@green.com',
    wasteCategories: ['plastic'],
  };

  it('returns 201 with business data for admin role', async () => {
    mockCreate.mockResolvedValue(mockBusinessRow);

    const res = await request(app)
      .post('/api/v1/businesses')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('organizationId');
    expect(res.body).not.toHaveProperty('organization_id');
  });

  it('returns 401 when Authorization header is absent', async () => {
    const res = await request(app).post('/api/v1/businesses').send(validBody);

    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/businesses')
      .set('Authorization', 'Bearer totally.invalid.token')
      .send(validBody);

    expect(res.status).toBe(401);
  });

  it('returns 403 for driver role', async () => {
    const res = await request(app)
      .post('/api/v1/businesses')
      .set('Authorization', `Bearer ${makeToken('driver')}`)
      .send(validBody);

    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/businesses')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'Only Name' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for latitude out of range', async () => {
    const res = await request(app)
      .post('/api/v1/businesses')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody, latitude: 200 });

    expect(res.status).toBe(400);
  });
});

// ─── GET /businesses ───────────────────────────────────────────────────────

describe('GET /api/v1/businesses', () => {
  it('returns 200 with paginated list for authenticated dispatcher', async () => {
    mockList.mockResolvedValue({ data: [mockBusinessRow], total: 1 });

    const res = await request(app)
      .get('/api/v1/businesses')
      .set('Authorization', `Bearer ${makeToken('dispatcher')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/businesses');

    expect(res.status).toBe(401);
  });
});

// ─── GET /businesses/:id ───────────────────────────────────────────────────

describe('GET /api/v1/businesses/:id', () => {
  it('returns 200 with the business for the authenticated org', async () => {
    mockFindOne.mockResolvedValue(mockBusinessRow);

    const res = await request(app)
      .get('/api/v1/businesses/biz-uuid')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('biz-uuid');
  });

  it('returns 404 when business belongs to a different org (no resource leakage)', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/v1/businesses/other-org-biz')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });
});

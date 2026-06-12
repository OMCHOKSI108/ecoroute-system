import request from 'supertest';

jest.mock('../src/config/db');
jest.mock('../src/repositories/auth.repository');
jest.mock('bcryptjs');

import bcryptjs from 'bcryptjs';
import * as authRepo from '../src/repositories/auth.repository';
import { createApp } from '../src/app';

const mockHash = bcryptjs.hash as jest.Mock;
const mockCompare = bcryptjs.compare as jest.Mock;
const mockFindUser = authRepo.findUserByEmail as jest.Mock;
const mockFindOrg = authRepo.findOrganizationByEmail as jest.Mock;
const mockCreate = authRepo.createOrganizationAndAdminUser as jest.Mock;

const app = createApp();

const mockOrgRow: authRepo.OrganizationRow = {
  id: 'org-uuid',
  name: 'Test Org',
  email: 'org@test.com',
  phone: null,
  address: null,
  is_active: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

const mockUserRow: authRepo.UserRow = {
  id: 'user-uuid',
  organization_id: 'org-uuid',
  email: 'user@test.com',
  password_hash: '$2a$10$hashedpwd',
  first_name: 'Jane',
  last_name: 'Doe',
  role: 'admin',
  is_active: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ─── Register ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  const validBody = {
    orgName: 'Test Org',
    orgEmail: 'org@test.com',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'user@test.com',
    password: 'SecurePass1',
  };

  it('returns 201 with user, organization, and tokens on success', async () => {
    mockFindUser.mockResolvedValue(null);
    mockFindOrg.mockResolvedValue(null);
    mockHash.mockResolvedValue('$2a$10$hashed');
    mockCreate.mockResolvedValue({ org: mockOrgRow, user: mockUserRow });

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('organization');
    expect(res.body).toHaveProperty('tokens');
    expect(res.body.tokens).toHaveProperty('accessToken');
    expect(res.body.tokens).toHaveProperty('refreshToken');
    // Must not expose password hash
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 409 when user email already exists', async () => {
    mockFindUser.mockResolvedValue(mockUserRow);

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user@test.com', password: 'pass1234' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BAD_REQUEST');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, password: 'short' });

    expect(res.status).toBe(400);
  });
});

// ─── Login ─────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  const validBody = { email: 'user@test.com', password: 'SecurePass1' };

  it('returns 200 with user and tokens on success', async () => {
    mockFindUser.mockResolvedValue(mockUserRow);
    mockCompare.mockResolvedValue(true);

    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('tokens');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('returns 401 when password is wrong', async () => {
    mockFindUser.mockResolvedValue(mockUserRow);
    mockCompare.mockResolvedValue(false);

    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 401 (same message) when user does not exist', async () => {
    mockFindUser.mockResolvedValue(null);

    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    expect(res.status).toBe(401);
    // Same message — no user enumeration
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});

    expect(res.status).toBe(400);
  });
});

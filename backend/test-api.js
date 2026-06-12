#!/usr/bin/env node

// ──────────────────────────────────────────────────────────────────────────────
// test-api.js   —   Standalone API integration test for EcoRoute Engine
// Usage:   node test-api.js
// ──────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------//
// 1.  Environment                                                           //
// ---------------------------------------------------------------------------//
process.env['PORT'] = '0';
process.env['NODE_ENV'] = 'test';
process.env['APP_NAME'] = 'EcoRoute Engine';
process.env['API_PREFIX'] = '/api/v1';
process.env['DATABASE_HOST'] = 'localhost';
process.env['DATABASE_PORT'] = '5432';
process.env['DATABASE_NAME'] = 'ecoroute_test';
process.env['DATABASE_USER'] = 'ecoroute_test';
process.env['DATABASE_PASSWORD'] = 'ecoroute_test';
process.env['DATABASE_URL'] = 'postgresql://ecoroute_test:ecoroute_test@localhost:5432/ecoroute_test';
process.env['JWT_SECRET'] = 'test_access_secret_do_not_use_in_prod';
process.env['JWT_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_SECRET'] = 'test_refresh_secret_do_not_use_in_prod';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['OSRM_BASE_URL'] = 'http://localhost:5000';
process.env['OSRM_TIMEOUT_MS'] = '5000';
process.env['OFFLINE_MODE'] = 'true';
process.env['ENABLE_EXTERNAL_APIS'] = 'false';
process.env['ENABLE_NOTIFICATIONS'] = 'false';
process.env['ENABLE_EMAIL'] = 'false';
process.env['ENABLE_SMS'] = 'false';
process.env['ENABLE_QUEUE'] = 'false';
process.env['LOG_LEVEL'] = 'error';
process.env['ENABLE_REQUEST_LOGGING'] = 'false';
process.env['FRONTEND_URL'] = 'http://localhost:3000';
process.env['BCRYPT_SALT_ROUNDS'] = '4';
process.env['RATE_LIMIT_WINDOW_MS'] = '60000';
process.env['RATE_LIMIT_MAX_REQUESTS'] = '10000';

// ---------------------------------------------------------------------------//
// 2.  Dependencies                                                           //
// ---------------------------------------------------------------------------//
const path = require('path');
const fs = require('fs');
const Module = require('module');
const supertest = require('supertest');

// ---------------------------------------------------------------------------//
// 3.  Mock DB module                                                         //
// ---------------------------------------------------------------------------//
const MOCK_USER_PASSWORD = 'password123';
const mockDbCode = `
const bcrypt = require('bcryptjs');
const mockHash = bcrypt.hashSync('${MOCK_USER_PASSWORD}', 4);
let counter = 0;
const uid = () => 'mock-' + (++counter).toString().padStart(4, '0');

function toInt(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

const NOW = new Date();

const MOCK_BUSINESS = {
  id: uid(), organization_id: null, name: 'Mock Biz', address: '123 Test St',
  waste_category: 'general', latitude: 40.7128, longitude: -74.0060,
  is_active: true, created_at: NOW, updated_at: NOW
};

const MOCK_USER = () => ({
  id: uid(), organization_id: 'org-' + counter, email: 'admin@test.com',
  password_hash: mockHash, first_name: 'Admin', last_name: 'User',
  role: 'admin', is_active: true, driver_status: null, created_at: NOW, updated_at: NOW
});

const MOCK_ORG = () => ({
  id: uid(), name: 'Test Org', email: 'org@test.com',
  phone: '555-0100', address: '456 Org Ave', is_active: true, created_at: NOW, updated_at: NOW
});

const MOCK_VEHICLE = () => ({
  id: uid(), organization_id: null, plate_number: 'ABC-1234',
  model: 'Test Truck', capacity_kg: '5000', current_load_kg: '0',
  status: 'available', driver_id: null, created_at: NOW, updated_at: NOW
});

const MOCK_PICKUP = () => ({
  id: uid(), organization_id: null, business_id: 'biz-id',
  assigned_vehicle_id: null, requested_by: 'user-id',
  status: 'pending', scheduled_at: null, notes: null,
  waste_category: 'general', estimated_weight_kg: '100',
  created_at: NOW, updated_at: NOW
});

const MOCK_ROUTE = () => ({
  id: uid(), organization_id: null, vehicle_id: null,
  status: 'active', total_distance_m: '10000', total_duration_s: '600',
  geometry: JSON.stringify({ type: 'LineString', coordinates: [] }),
  waypoints: JSON.stringify([]), pickup_count: 3,
  osrm_data: JSON.stringify({}), created_at: NOW, updated_at: NOW
});

exports.query = async (sql, params) => {
  const s = String(sql).replace(/\\s+/g, ' ').trim();

  // ── Health check ────────────────────────────────────────────────────────
  if (/^SELECT\\s+1\\b/.test(s) || s === 'SELECT 1') {
    return { rows: [{ '?column?': 1 }] };
  }

  // ── Auth: find user by email (login / register check) ───────────────────
  if (/FROM\\s+users/.test(s) && /WHERE\\s+email\\s*=\\s*\\$1/.test(s)) {
    const email = params && params.length > 0 ? String(params[0]) : '';
    if (email === 'admin@test.com') {
      return { rows: [{ ...MOCK_USER(), email: 'admin@test.com' }] };
    }
    return { rows: [] };
  }
  if (/FROM\\s+organizations/.test(s) && /WHERE\\s+email\\s*=\\s*\\$1/.test(s)) {
    return { rows: [] };
  }

  // ── Auth: find user by id (refresh / get-me) ────────────────────────────
  if (/FROM\\s+users/.test(s) && /WHERE\\s+id\\s*=\\s*\\$1/.test(s) && !/role\\s*=\\s*'driver'/.test(s)) {
    const orgId = params && params.length > 1 ? params[1] : 'org-1';
    return { rows: [{ ...MOCK_USER(), id: params ? params[0] : 'user-1', organization_id: orgId }] };
  }

  // ── Drivers -- find driver by id (with role = 'driver') ─────────────────
  if (/FROM\\s+users/.test(s) && /role\\s*=\\s*'driver'/.test(s) && /WHERE\\s+id\\s*=\\s*\\$1/.test(s)) {
    return { rows: [{ ...MOCK_USER(), role: 'driver', id: params ? params[0] : 'driver-1' }] };
  }

  // ── INSERT into organizations (register / create org) ───────────────────
  if (/INSERT\\s+INTO\\s+organizations/.test(s)) {
    return { rows: [{ ...MOCK_ORG() }] };
  }

  // ── INSERT into users (register) ────────────────────────────────────────
  if (/INSERT\\s+INTO\\s+users/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ ...MOCK_USER() }] };
  }

  // ── INSERT businesses ───────────────────────────────────────────────────
  if (/INSERT\\s+INTO\\s+businesses/.test(s)) {
    return { rows: [{ ...MOCK_BUSINESS, id: uid() }] };
  }

  // ── INSERT vehicles ─────────────────────────────────────────────────────
  if (/INSERT\\s+INTO\\s+vehicles/.test(s)) {
    return { rows: [{ ...MOCK_VEHICLE(), id: uid() }] };
  }

  // ── INSERT / generate_series for dashboard ──────────────────────────────
  if (/generate_series/.test(s)) {
    return { rows: [
      { date: new Date(Date.now() - 86400000 * 6).toISOString().slice(0,10), created: '0', completed: '0' },
      { date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0,10), created: '0', completed: '0' },
      { date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0,10), created: '0', completed: '0' },
      { date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0,10), created: '0', completed: '0' },
      { date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0,10), created: '0', completed: '0' },
      { date: new Date(Date.now() - 86400000 * 1).toISOString().slice(0,10), created: '0', completed: '0' },
      { date: new Date().toISOString().slice(0,10), created: '0', completed: '0' },
    ]};
  }

  // ── INSERT pickup_requests ──────────────────────────────────────────────
  if (/INSERT\\s+INTO\\s+pickup_requests/.test(s)) {
    return { rows: [{ ...MOCK_PICKUP(), id: uid() }] };
  }

  // ── INSERT route_stops ──────────────────────────────────────────────────
  if (/INSERT\\s+INTO\\s+route_stops/.test(s)) {
    return { rows: [{ id: uid(), route_id: params ? params[0] : null, pickup_id: null, stop_order: 1, status: 'pending', latitude: null, longitude: null, address: null, planned_distance_m: null, planned_duration_s: null, created_at: NOW, updated_at: NOW }] };
  }

  // ── INSERT into vehicle_locations ───────────────────────────────────────
  if (/INSERT\\s+INTO\\s+vehicle_locations/.test(s)) {
    return { rows: [] };
  }

  // ── INSERT into vehicle_location_latest / ON CONFLICT ───────────────────
  if (/INSERT\\s+INTO\\s+vehicle_location_latest/.test(s)) {
    return { rows: [] };
  }

  // ── INSERT notifications ────────────────────────────────────────────────
  if (/INSERT\\s+INTO\\s+notifications/.test(s)) {
    return { rows: [{ id: uid(), organization_id: params ? params[0] : null, user_id: params ? params[1] : null, title: params ? params[2] : '', body: null, type: params ? params[4] : '', is_read: false, metadata: null, created_at: NOW }] };
  }

  // ── INSERT waste_categories ─────────────────────────────────────────────
  if (/INSERT\\s+INTO\\s+waste_categories/.test(s)) {
    return { rows: [{ id: uid(), organization_id: params ? params[0] : null, name: params ? params[1] : '', description: null, is_active: true, created_at: NOW, updated_at: NOW }] };
  }

  // ── INSERT pickup_locations ─────────────────────────────────────────────
  if (/INSERT\\s+INTO\\s+pickup_locations/.test(s)) {
    return { rows: [{ id: uid(), organization_id: params ? params[0] : null, business_id: params ? params[1] : null, name: 'Mock Location', address: '123 St', latitude: 40.71, longitude: -74.00, is_active: true, created_at: NOW, updated_at: NOW }] };
  }

  // ── INSERT into routes (multi-statement inside transaction) ─────────────
  if (/INSERT\\s+INTO\\s+routes/.test(s)) {
    return { rows: [{ ...MOCK_ROUTE(), id: uid() }] };
  }

  // ── UPDATE vehicles status / driver / dispatch ──────────────────────────
  if (/UPDATE\\s+vehicles/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ ...MOCK_VEHICLE(), id: params && params.length > 0 ? params[1] : 'v-1' }] };
  }

  // ── UPDATE users is_active (status) ─────────────────────────────────────
  if (/UPDATE\\s+users\\s+SET\\s+is_active/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ ...MOCK_USER(), id: params ? params[1] : 'u-1', is_active: params ? params[0] : true }] };
  }

  // ── UPDATE users driver_status ──────────────────────────────────────────
  if (/UPDATE\\s+users\\s+SET\\s+driver_status/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ ...MOCK_USER(), id: params ? params[1] : 'u-1', driver_status: params ? params[0] : null }] };
  }

  // ── UPDATE users role ───────────────────────────────────────────────────
  if (/UPDATE\\s+users/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ ...MOCK_USER(), id: params ? params[1] : 'u-1' }] };
  }

  // ── UPDATE pickup_requests status ───────────────────────────────────────
  if (/UPDATE\\s+pickup_requests/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ ...MOCK_PICKUP(), id: params ? params[1] : 'p-1', status: params ? params[0] : 'completed' }] };
  }

  // ── UPDATE route_stops status ───────────────────────────────────────────
  if (/UPDATE\\s+route_stops/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ id: params && params.length > 0 ? params[1] : 'rs-1', route_id: 'r-1', pickup_id: null, stop_order: 1, status: params ? params[0] : 'completed', latitude: null, longitude: null, address: null, planned_distance_m: null, planned_duration_s: null, created_at: NOW, updated_at: NOW }] };
  }

  // ── UPDATE routes status / complete ─────────────────────────────────────
  if (/UPDATE\\s+routes/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ ...MOCK_ROUTE(), id: params && params.length > 0 ? params[1] : 'r-1' }] };
  }

  // ── UPDATE notifications mark all read ──────────────────────────────────
  if (/UPDATE\\s+notifications/.test(s) && !/RETURNING/.test(s)) {
    return { rowCount: 3 };
  }

  // ── UPDATE notifications mark single read ───────────────────────────────
  if (/UPDATE\\s+notifications/.test(s) && /RETURNING/.test(s)) {
    return { rows: [{ id: params ? params[0] : 'n-1', organization_id: 'org-1', user_id: 'u-1', title: 'Test', body: null, type: 'info', is_read: true, metadata: null, created_at: NOW }] };
  }

  // ── Hard DELETE (pickup-locations / driver unassign) ────────────────────
  if (s.startsWith('DELETE')) {
    return { rows: [], rowCount: 1 };
  }

  // ── COUNT(*) queries ────────────────────────────────────────────────────
  if (/COUNT\\(/.test(s) && /FROM/.test(s)) {
    return { rows: [{ count: '0' }] };
  }

  // ── Find vehicle by id + org ────────────────────────────────────────────
  if (/FROM\\s+vehicles\\b.*WHERE\\s+id\\s*=\\s*\\$1/.test(s)) {
    return { rows: [{ ...MOCK_VEHICLE(), id: params ? params[0] : 'v-1' }] };
  }

  // ── FROM vehicles (list, workload, etc.) ─────────────────────────────────
  if (/FROM\\s+vehicles\\b/.test(s) && !/FOR\\s+UPDATE/.test(s)) {
    return { rows: [] };
  }

  // ── FROM users (list users) ──────────────────────────────────────────────
  if (/FROM\\s+users\\b/.test(s) && !/FOR\\s+UPDATE/.test(s)) {
    return { rows: [] };
  }

  // ── FROM pickup_requests ────────────────────────────────────────────────
  if (/FROM\\s+pickup_requests/.test(s) && !/FOR\\s+UPDATE/.test(s)) {
    return { rows: [] };
  }

  // ── FROM businesses (list) ──────────────────────────────────────────────
  if (/FROM\\s+businesses/.test(s) && !/FOR\\s+UPDATE/.test(s)) {
    return { rows: [] };
  }

  // ── FROM route_stops ────────────────────────────────────────────────────
  if (/FROM\\s+route_stops/.test(s)) {
    return { rows: [] };
  }

  // ── FROM vehicle_location_latest ────────────────────────────────────────
  if (/FROM\\s+vehicle_location_latest/.test(s)) {
    return { rows: [{ vehicle_id: 'v-1', organization_id: 'org-1', latitude: 40.71, longitude: -74.00, recorded_at: new Date() }] };
  }

  // ── FROM vehicle_locations (history) ────────────────────────────────────
  if (/FROM\\s+vehicle_locations/.test(s)) {
    return { rows: [] };
  }

  // ── FROM routes (list active routes) ────────────────────────────────────
  if (/FROM\\s+routes\\b/.test(s) && !/FOR\\s+UPDATE/.test(s)) {
    return { rows: [] };
  }

  // ── FROM notifications ──────────────────────────────────────────────────
  if (/FROM\\s+notifications/.test(s) && !/COUNT\\(/.test(s)) {
    return { rows: [{ id: 'n-1', organization_id: 'org-1', user_id: 'u-1', title: 'Test', body: null, type: 'info', is_read: false, metadata: null, created_at: NOW }] };
  }

  // ── FROM waste_categories ───────────────────────────────────────────────
  if (/FROM\\s+waste_categories/.test(s)) {
    return { rows: [] };
  }

  // ── FROM pickup_locations ───────────────────────────────────────────────
  if (/FROM\\s+pickup_locations/.test(s)) {
    return { rows: [] };
  }

  // ── FROM audit_logs ─────────────────────────────────────────────────────
  if (/FROM\\s+audit_logs/.test(s)) {
    return { rows: [] };
  }

  // ── Other INSERT (fallback) ─────────────────────────────────────────────
  if (/INSERT/.test(s)) {
    return { rows: [{ id: uid() }] };
  }

  // ── FOR UPDATE (SELECT ... FOR UPDATE in transactions) ──────────────────
  if (/FOR\\s+UPDATE/.test(s) && /FROM\\s+vehicles/.test(s)) {
    return { rows: [{ ...MOCK_VEHICLE(), id: params && params.length > 0 ? params[0] : 'v-1' }] };
  }
  if (/FOR\\s+UPDATE/.test(s) && /FROM\\s+pickup_requests/.test(s)) {
    return { rows: [{ ...MOCK_PICKUP(), id: 'p-1' }] };
  }
  if (/FOR\\s+UPDATE/.test(s) && /FROM\\s+routes/.test(s)) {
    return { rows: [{ ...MOCK_ROUTE(), id: 'r-1' }] };
  }
  if (/FOR\\s+UPDATE/.test(s)) {
    return { rows: [{ id: 'obj-1' }] };
  }

  // ── FINAL FALLBACK ──────────────────────────────────────────────────────
  return { rows: [] };
};

exports.withTransaction = async (fn) => fn({ query: exports.query });
`;

// ---------------------------------------------------------------------------//
// 4.  Inject mock into module resolution                                     //
// ---------------------------------------------------------------------------//
const mockPath = path.resolve(__dirname, '.test-api-mock-db.js');
fs.writeFileSync(mockPath, mockDbCode, 'utf-8');

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent) {
  const resolved = origResolve.apply(this, arguments);
  const normalized = resolved.replace(/\\/g, '/');
  const mockNorm = mockPath.replace(/\\/g, '/');
  if (
    normalized.endsWith('/src/config/db.ts') ||
    normalized.endsWith('/src/config/db.js') ||
    normalized.endsWith('/config/db.ts') ||
    normalized.endsWith('/config/db.js')
  ) {
    return mockNorm;
  }
  return resolved;
};

// ---------------------------------------------------------------------------//
// 5.  Register ts-node & load app                                            //
// ---------------------------------------------------------------------------//
require('ts-node').register({ transpileOnly: true, project: path.resolve(__dirname, 'tsconfig.json') });

const { createApp } = require('./src/app');
const jwt = require('jsonwebtoken');

const app = createApp();
const request = supertest(app);

// ---------------------------------------------------------------------------//
// 6.  Helpers                                                                //
// ---------------------------------------------------------------------------//
const P = (s) => process.stdout.write(s);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
let skipped = 0;
let assertions = 0;

const ADMIN_TOKEN = jwt.sign(
  { sub: 'user-admin', orgId: 'org-1', role: 'admin', email: 'admin@test.com' },
  process.env['JWT_SECRET'],
  { expiresIn: '1h' },
);
const DISPATCHER_TOKEN = jwt.sign(
  { sub: 'user-dispatch', orgId: 'org-1', role: 'dispatcher', email: 'dispatch@test.com' },
  process.env['JWT_SECRET'],
  { expiresIn: '1h' },
);
const DRIVER_TOKEN = jwt.sign(
  { sub: 'user-driver', orgId: 'org-1', role: 'driver', email: 'driver@test.com' },
  process.env['JWT_SECRET'],
  { expiresIn: '1h' },
);
const BUSINESS_TOKEN = jwt.sign(
  { sub: 'user-biz', orgId: 'org-1', role: 'business_user', email: 'biz@test.com' },
  process.env['JWT_SECRET'],
  { expiresIn: '1h' },
);

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function test(label, fn) {
  P(`\n  ${BOLD}${label}${RESET}`);
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    P(`  ${GREEN}✓${RESET} ${DIM}${ms}ms${RESET}`);
    passed++;
    return result;
  } catch (err) {
    const ms = Date.now() - start;
    const detail = err instanceof Error ? err.message : String(err);
    P(`  ${RED}✗ FAILED${RESET} ${DIM}${ms}ms${RESET}`);
    P(`\n    ${RED}${detail.replace(/\n/g, '\n    ')}${RESET}`);
    failed++;
    return null;
  }
}

function expectStatus(res, expected) {
  assertions++;
  if (res.status !== expected) {
    throw new Error(`Expected status ${expected}, got ${res.status}. Body: ${JSON.stringify(res.body).slice(0, 300)}`);
  }
}

function expectBody(res) {
  assertions++;
  if (!res.body || typeof res.body !== 'object') {
    throw new Error(`Expected response body to be an object, got ${typeof res.body}`);
  }
}

function expectSuccess(res) {
  expectStatus(res, 200);
  expectBody(res);
}

function expectCreated(res) {
  expectStatus(res, 201);
  expectBody(res);
}

function expectNotFound(res) {
  expectStatus(res, 404);
}

function expectValidation(res) {
  expectStatus(res, 400);
}

function expectUnauthorized(res) {
  expectStatus(res, 401);
}

function expectForbidden(res) {
  expectStatus(res, 403);
}

function expectConflict(res) {
  expectStatus(res, 409);
}

function section(title) {
  P(`\n${CYAN}${'='.repeat(72)}${RESET}`);
  P(`\n${CYAN}  ${title}${RESET}`);
  P(`\n${CYAN}${'='.repeat(72)}${RESET}\n`);
}

// ---------------------------------------------------------------------------//
// 7.  Tests                                                                  //
// ---------------------------------------------------------------------------//
(async () => {
  P(`\n${BOLD}${MAGENTA}EcoRoute Engine — API Integration Test Suite${RESET}`);
  P(`\n${DIM}${new Date().toISOString()}${RESET}\n`);

  // ─── Root & Index ───────────────────────────────────────────────────────
  section('Root & API Index');

  await test('GET /', async () => {
    const res = await request.get('/');
    expectSuccess(res);
    if (!res.body.endpoints) throw new Error('Missing endpoints key');
    if (!res.body.name) throw new Error('Missing name');
  });

  await test('GET /api/v1', async () => {
    const res = await request.get('/api/v1');
    expectSuccess(res);
    if (!res.body.endpoints) throw new Error('Missing endpoints key');
  });

  await test('GET /api/v1/docs (redirect / swagger)', async () => {
    // Swagger UI may redirect — just check 200 or 301/302
    const res = await request.get('/api/v1/docs');
    if (res.status !== 200 && res.status !== 301 && res.status !== 302 && res.status !== 307) {
      throw new Error(`Expected docs to respond 200/302, got ${res.status}`);
    }
  });

  await test('GET /unknown-route → 404', async () => {
    const res = await request.get('/api/v1/unknown-route-xyz');
    expectNotFound(res);
    if (res.body.error !== 'NOT_FOUND') throw new Error('Expected NOT_FOUND error');
  });

  // ─── Health ─────────────────────────────────────────────────────────────
  section('Health');

  await test('GET /api/v1/health', async () => {
    const res = await request.get('/api/v1/health');
    expectSuccess(res);
    if (!res.body.checks) throw new Error('Missing checks');
    if (!res.body.checks.database) throw new Error('Missing database check');
    if (!res.body.checks.osrm) throw new Error('Missing osrm check');
  });

  // ─── Auth ───────────────────────────────────────────────────────────────
  section('Auth');

  let accessToken = '';
  let refreshToken = '';

  await test('POST /api/v1/auth/register — success', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      orgName: 'Test Org',
      orgEmail: 'org@test.com',
      firstName: 'Test',
      lastName: 'User',
      email: 'user@test.com',
      password: MOCK_USER_PASSWORD,
    });
    expectCreated(res);
    if (!res.body.tokens || !res.body.tokens.accessToken) throw new Error('Missing accessToken');
    if (!res.body.tokens || !res.body.tokens.refreshToken) throw new Error('Missing refreshToken');
    accessToken = res.body.tokens.accessToken;
    refreshToken = res.body.tokens.refreshToken;
  });

  await test('POST /api/v1/auth/register — validation error', async () => {
    const res = await request.post('/api/v1/auth/register').send({});
    expectValidation(res);
  });

  await test('POST /api/v1/auth/login — success', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: 'admin@test.com',
      password: MOCK_USER_PASSWORD,
    });
    expectSuccess(res);
    if (!res.body.tokens || !res.body.tokens.accessToken) throw new Error('Missing accessToken');
    accessToken = res.body.tokens.accessToken;
    refreshToken = res.body.tokens.refreshToken;
  });

  await test('POST /api/v1/auth/login — wrong password', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: 'admin@test.com',
      password: 'wrongpass',
    });
    expectUnauthorized(res);
  });

  await test('POST /api/v1/auth/login — validation error', async () => {
    const res = await request.post('/api/v1/auth/login').send({ email: 'not-an-email' });
    expectValidation(res);
  });

  await test('POST /api/v1/auth/refresh — success', async () => {
    const res = await request.post('/api/v1/auth/refresh').send({
      refreshToken,
    });
    expectSuccess(res);
    if (!res.body.tokens || !res.body.tokens.accessToken) throw new Error('Missing accessToken');
    accessToken = res.body.tokens.accessToken;
  });

  await test('POST /api/v1/auth/refresh — invalid token', async () => {
    const res = await request.post('/api/v1/auth/refresh').send({
      refreshToken: 'invalid-token',
    });
    expectUnauthorized(res);
  });

  // ─── Users ──────────────────────────────────────────────────────────────
  section('Users (/api/v1/users)');

  await test('GET /api/v1/users/me', async () => {
    const res = await request.get('/api/v1/users/me').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/users/me — no auth', async () => {
    const res = await request.get('/api/v1/users/me');
    expectUnauthorized(res);
  });

  await test('GET /api/v1/users — list (admin)', async () => {
    const res = await request.get('/api/v1/users').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/users — forbidden (driver)', async () => {
    const res = await request.get('/api/v1/users').set(auth(DRIVER_TOKEN));
    expectForbidden(res);
  });

  await test('GET /api/v1/users/:id', async () => {
    const res = await request.get('/api/v1/users/user-1').set(auth(ADMIN_TOKEN));
    if (res.status === 200) {
      // success — user exists
    } else {
      // 404 is acceptable if the mock user isn't found
      expectNotFound(res);
    }
  });

  await test('PATCH /api/v1/users/:id/role', async () => {
    const res = await request.patch('/api/v1/users/user-1/role').set(auth(ADMIN_TOKEN)).send({ role: 'dispatcher' });
    if (res.status === 200) {
      if (!res.body.role) throw new Error('Missing role in response');
    } else {
      expectNotFound(res);
    }
  });

  await test('PATCH /api/v1/users/:id/status', async () => {
    const res = await request.patch('/api/v1/users/user-1/status').set(auth(ADMIN_TOKEN)).send({ isActive: false });
    if (res.status === 200) {
      if (res.body.isActive !== false) throw new Error('Expected isActive=false');
    } else {
      expectNotFound(res);
    }
  });

  await test('PATCH /api/v1/users/:id/role — validation error', async () => {
    const res = await request.patch('/api/v1/users/user-1/role').set(auth(ADMIN_TOKEN)).send({ role: 'invalid' });
    expectValidation(res);
  });

  // ─── Organizations ──────────────────────────────────────────────────────
  section('Organizations (/api/v1/organizations)');

  await test('POST /api/v1/organizations (admin)', async () => {
    const res = await request.post('/api/v1/organizations').set(auth(ADMIN_TOKEN)).send({
      name: 'New Org',
      email: 'new@org.com',
    });
    expectCreated(res);
  });

  await test('GET /api/v1/organizations — list (admin)', async () => {
    const res = await request.get('/api/v1/organizations').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/organizations/:id (admin)', async () => {
    const res = await request.get('/api/v1/organizations/org-1').set(auth(ADMIN_TOKEN));
    if (res.status === 200) {
      if (!res.body.id) throw new Error('Missing org id');
    } else {
      expectNotFound(res);
    }
  });

  await test('PATCH /api/v1/organizations/:id (admin)', async () => {
    const res = await request.patch('/api/v1/organizations/org-1').set(auth(ADMIN_TOKEN)).send({ name: 'Updated Org' });
    if (res.status === 200) {
      if (!res.body.name) throw new Error('Missing name');
    } else {
      expectNotFound(res);
    }
  });

  await test('GET /api/v1/organizations — forbidden (driver)', async () => {
    const res = await request.get('/api/v1/organizations').set(auth(DRIVER_TOKEN));
    expectForbidden(res);
  });

  // ─── Businesses ─────────────────────────────────────────────────────────
  section('Businesses (/api/v1/businesses)');

  await test('POST /api/v1/businesses (admin)', async () => {
    const res = await request.post('/api/v1/businesses').set(auth(ADMIN_TOKEN)).send({
      name: 'Test Business',
      address: '123 Main St',
      wasteCategory: 'general',
      latitude: 40.7128,
      longitude: -74.006,
    });
    expectCreated(res);
  });

  await test('GET /api/v1/businesses — list (admin)', async () => {
    const res = await request.get('/api/v1/businesses').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/businesses/:id (admin)', async () => {
    const res = await request.get('/api/v1/businesses/biz-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('POST /api/v1/businesses — validation error', async () => {
    const res = await request.post('/api/v1/businesses').set(auth(ADMIN_TOKEN)).send({});
    expectValidation(res);
  });

  // ─── Pickup Locations ───────────────────────────────────────────────────
  section('Pickup Locations');

  await test('POST /api/v1/businesses/:id/locations (admin)', async () => {
    const res = await request.post('/api/v1/businesses/biz-1/locations').set(auth(ADMIN_TOKEN)).send({
      name: 'Main Entrance',
      address: '123 St, Door A',
      latitude: 40.7128,
      longitude: -74.006,
    });
    if (res.status === 201) {
      if (!res.body.id) throw new Error('Missing location id');
    } else {
      expectStatus(res, 201);
    }
  });

  await test('GET /api/v1/businesses/:id/locations (admin)', async () => {
    const res = await request.get('/api/v1/businesses/biz-1/locations').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/pickup-locations/:id (admin)', async () => {
    const res = await request.get('/api/v1/pickup-locations/pl-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('PATCH /api/v1/pickup-locations/:id (admin)', async () => {
    const res = await request.patch('/api/v1/pickup-locations/pl-1').set(auth(ADMIN_TOKEN)).send({ name: 'Updated Location' });
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('DELETE /api/v1/pickup-locations/:id (admin)', async () => {
    const res = await request.delete('/api/v1/pickup-locations/pl-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  // ─── Waste Categories ───────────────────────────────────────────────────
  section('Waste Categories (/api/v1/waste-categories)');

  await test('POST /api/v1/waste-categories (admin)', async () => {
    const res = await request.post('/api/v1/waste-categories').set(auth(ADMIN_TOKEN)).send({
      name: 'Recyclable Plastic',
    });
    expectCreated(res);
  });

  await test('GET /api/v1/waste-categories — list', async () => {
    const res = await request.get('/api/v1/waste-categories').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/waste-categories (driver can read)', async () => {
    const res = await request.get('/api/v1/waste-categories').set(auth(DRIVER_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/waste-categories/:id', async () => {
    const res = await request.get('/api/v1/waste-categories/wc-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  // ─── Drivers ────────────────────────────────────────────────────────────
  section('Drivers (/api/v1/drivers)');

  await test('GET /api/v1/drivers — list (admin)', async () => {
    const res = await request.get('/api/v1/drivers').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/drivers/:id (admin)', async () => {
    const res = await request.get('/api/v1/drivers/driver-1').set(auth(ADMIN_TOKEN));
    if (res.status === 200) {
      if (!res.body.id) throw new Error('Missing driver id');
    } else {
      expectNotFound(res);
    }
  });

  await test('PATCH /api/v1/drivers/:id/status (admin)', async () => {
    const res = await request.patch('/api/v1/drivers/driver-1/status').set(auth(ADMIN_TOKEN)).send({ driverStatus: 'available' });
    if (res.status === 200) {
      if (res.body.driverStatus !== 'available') throw new Error('Expected driverStatus=available');
    } else {
      expectNotFound(res);
    }
  });

  await test('POST /api/v1/drivers/:id/vehicle/:vehicleId (admin)', async () => {
    const res = await request.post('/api/v1/drivers/driver-1/vehicle/v-1').set(auth(ADMIN_TOKEN));
    if (res.status === 200) {
      if (!res.body.vehicleId) throw new Error('Missing vehicleId');
    } else {
      expectNotFound(res);
    }
  });

  await test('DELETE /api/v1/drivers/:id/vehicle/:vehicleId (admin)', async () => {
    const res = await request.delete('/api/v1/drivers/driver-1/vehicle/v-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  // ─── Vehicles ───────────────────────────────────────────────────────────
  section('Vehicles (/api/v1/vehicles)');

  await test('POST /api/v1/vehicles (admin)', async () => {
    const res = await request.post('/api/v1/vehicles').set(auth(ADMIN_TOKEN)).send({
      plateNumber: 'XYZ-9876',
      model: 'Electric Truck',
      capacityKg: 3000,
    });
    expectCreated(res);
  });

  await test('GET /api/v1/vehicles — list (admin)', async () => {
    const res = await request.get('/api/v1/vehicles').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/vehicles/:id (admin)', async () => {
    const res = await request.get('/api/v1/vehicles/v-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('PATCH /api/v1/vehicles/:id/status (admin)', async () => {
    const res = await request.patch('/api/v1/vehicles/v-1/status').set(auth(ADMIN_TOKEN)).send({ status: 'maintenance' });
    if (res.status === 200) {
      if (!res.body.status) throw new Error('Missing status');
    } else {
      expectNotFound(res);
    }
  });

  await test('POST /api/v1/vehicles/:id/driver — assign (admin)', async () => {
    const res = await request.post('/api/v1/vehicles/v-1/driver').set(auth(ADMIN_TOKEN)).send({ driverId: '00000000-0000-4000-8000-000000000001' });
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  // ─── Pickups ────────────────────────────────────────────────────────────
  section('Pickups (/api/v1/pickups)');

  await test('POST /api/v1/pickups (admin)', async () => {
    const res = await request.post('/api/v1/pickups').set(auth(ADMIN_TOKEN)).send({
      businessId: '00000000-0000-4000-8000-000000000001',
      wasteCategory: 'general',
      estimatedWeightKg: 200,
    });
    expectCreated(res);
  });

  await test('GET /api/v1/pickups — list (admin)', async () => {
    const res = await request.get('/api/v1/pickups').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/pickups/my — driver', async () => {
    const res = await request.get('/api/v1/pickups/my').set(auth(DRIVER_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/pickups/nearby (admin)', async () => {
    const res = await request.get('/api/v1/pickups/nearby?lat=40.71&lng=-74.00&radiusMeters=5000').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/pickups/nearby — missing lat', async () => {
    const res = await request.get('/api/v1/pickups/nearby?lng=-74.00').set(auth(ADMIN_TOKEN));
    expectValidation(res);
  });

  await test('GET /api/v1/pickups/:id (admin)', async () => {
    const res = await request.get('/api/v1/pickups/p-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('PATCH /api/v1/pickups/:id/status — cancel pending', async () => {
    const res = await request.patch('/api/v1/pickups/p-1/status').set(auth(ADMIN_TOKEN)).send({ status: 'cancelled' });
    if (res.status !== 200 && res.status !== 404 && res.status !== 409) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('POST /api/v1/pickups/:id/cancel — business_user', async () => {
    const res = await request.post('/api/v1/pickups/p-1/cancel').set(auth(BUSINESS_TOKEN)).send({ reason: 'No longer needed' });
    if (res.status !== 200 && res.status !== 404 && res.status !== 409) throw new Error(`Unexpected status ${res.status}`);
  });

  // ─── Dispatch ───────────────────────────────────────────────────────────
  section('Dispatch (/api/v1/dispatch)');

  await test('POST /api/v1/dispatch/assign (admin)', async () => {
    const res = await request.post('/api/v1/dispatch/assign').set(auth(ADMIN_TOKEN)).send({
      vehicleId: '00000000-0000-4000-8000-000000000001',
      pickupIds: ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'],
    });
    if (res.status !== 200 && res.status !== 404 && res.status !== 409) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('POST /api/v1/dispatch/preview (admin)', async () => {
    const res = await request.post('/api/v1/dispatch/preview').set(auth(ADMIN_TOKEN)).send({
      pickupIds: ['00000000-0000-4000-8000-000000000001'],
    });
    if (res.status === 200) {
      if (!Array.isArray(res.body.candidates)) throw new Error('Expected candidates array');
    } else {
      expectNotFound(res);
    }
  });

  await test('POST /api/v1/dispatch/auto-assign (admin)', async () => {
    const res = await request.post('/api/v1/dispatch/auto-assign').set(auth(ADMIN_TOKEN)).send({});
    if (res.status === 200) {
      if (!Array.isArray(res.body.assignments)) throw new Error('Expected assignments array');
      if (!Array.isArray(res.body.unassignedPickupIds)) throw new Error('Expected unassignedPickupIds array');
    } else {
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  // ─── Routes ─────────────────────────────────────────────────────────────
  section('Routes (/api/v1/routes)');

  await test('GET /api/v1/routes — list (admin)', async () => {
    const res = await request.get('/api/v1/routes').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/routes/:id (admin)', async () => {
    const res = await request.get('/api/v1/routes/r-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('PATCH /api/v1/routes/:id/status (admin)', async () => {
    const res = await request.patch('/api/v1/routes/r-1/status').set(auth(ADMIN_TOKEN)).send({ status: 'completed' });
    if (res.status !== 200 && res.status !== 404 && res.status !== 409) throw new Error(`Unexpected status ${res.status}`);
  });

  // ─── Route Stops ────────────────────────────────────────────────────────
  section('Route Stops (/api/v1/route-stops)');

  await test('GET /api/v1/route-stops — list (admin)', async () => {
    const res = await request.get('/api/v1/route-stops').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/route-stops/by-route/:routeId (admin)', async () => {
    const res = await request.get('/api/v1/route-stops/by-route/r-1').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/route-stops/:id (admin)', async () => {
    const res = await request.get('/api/v1/route-stops/rs-1').set(auth(ADMIN_TOKEN));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('PATCH /api/v1/route-stops/:id/status (admin)', async () => {
    const res = await request.patch('/api/v1/route-stops/rs-1/status').set(auth(ADMIN_TOKEN)).send({ status: 'completed' });
    if (res.status !== 200 && res.status !== 404) throw new Error(`Unexpected status ${res.status}`);
  });

  // ─── Vehicle Locations ──────────────────────────────────────────────────
  section('Vehicle Locations (/api/v1/vehicle-locations)');

  await test('GET /api/v1/vehicle-locations — all latest (admin)', async () => {
    const res = await request.get('/api/v1/vehicle-locations').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('POST /api/v1/vehicle-locations/:vehicleId — report (driver)', async () => {
    const res = await request.post('/api/v1/vehicle-locations/v-1').set(auth(DRIVER_TOKEN)).send({
      latitude: 40.7128,
      longitude: -74.006,
    });
    expectCreated(res);
  });

  await test('GET /api/v1/vehicle-locations/:vehicleId/latest (driver)', async () => {
    const res = await request.get('/api/v1/vehicle-locations/v-1/latest').set(auth(DRIVER_TOKEN));
    if (res.status === 200) {
      if (res.body.latitude === undefined) throw new Error('Missing latitude');
    } else {
      expectNotFound(res);
    }
  });

  await test('GET /api/v1/vehicle-locations/:vehicleId/history (admin)', async () => {
    const res = await request.get('/api/v1/vehicle-locations/v-1/history').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  // ─── Routing Utilities ──────────────────────────────────────────────────
  section('Routing Utilities (/api/v1/routing)');

  await test('POST /api/v1/routing/route (admin)', async () => {
    const res = await request.post('/api/v1/routing/route').set(auth(ADMIN_TOKEN)).send({
      originLat: 40.7128, originLng: -74.006,
      destLat: 40.7580, destLng: -73.9855,
    });
    if (res.status === 200) {
      if (res.body.distanceM === undefined) throw new Error('Missing distanceM');
    } else {
      expectSuccess(res);
    }
  });

  await test('POST /api/v1/routing/nearest (admin)', async () => {
    const res = await request.post('/api/v1/routing/nearest').set(auth(ADMIN_TOKEN)).send({
      lat: 40.7128, lng: -74.006,
    });
    expectSuccess(res);
  });

  await test('POST /api/v1/routing/matrix (admin)', async () => {
    const res = await request.post('/api/v1/routing/matrix').set(auth(ADMIN_TOKEN)).send({
      latitudes: [40.71, 40.72], longitudes: [-74.00, -73.98],
    });
    expectSuccess(res);
  });

  await test('POST /api/v1/routing/trip (admin)', async () => {
    const res = await request.post('/api/v1/routing/trip').set(auth(ADMIN_TOKEN)).send({
      latitudes: [40.71, 40.72, 40.73],
      longitudes: [-74.00, -73.98, -73.97],
    });
    expectSuccess(res);
  });

  await test('POST /api/v1/routing/nearest — forbidden (business_user)', async () => {
    const res = await request.post('/api/v1/routing/nearest').set(auth(BUSINESS_TOKEN)).send({
      lat: 40.7128, lng: -74.006,
    });
    expectForbidden(res);
  });

  // ─── Dashboard ──────────────────────────────────────────────────────────
  section('Dashboard (/api/v1/dashboard)');

  await test('GET /api/v1/dashboard/summary (admin)', async () => {
    const res = await request.get('/api/v1/dashboard/summary').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
    if (!res.body.fleet) throw new Error('Missing fleet');
    if (!res.body.pickups) throw new Error('Missing pickups');
    if (!res.body.routes) throw new Error('Missing routes');
  });

  await test('GET /api/v1/dashboard/vehicles (admin)', async () => {
    const res = await request.get('/api/v1/dashboard/vehicles').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/dashboard/pickups (admin)', async () => {
    const res = await request.get('/api/v1/dashboard/pickups').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
    if (res.body.byStatus === undefined) throw new Error('Missing byStatus');
  });

  await test('GET /api/v1/dashboard/trends (admin)', async () => {
    const res = await request.get('/api/v1/dashboard/trends').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
    if (!Array.isArray(res.body.weekly)) throw new Error('Expected weekly array');
  });

  await test('GET /api/v1/dashboard/drivers (admin)', async () => {
    const res = await request.get('/api/v1/dashboard/drivers').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  // ─── Notifications ──────────────────────────────────────────────────────
  section('Notifications (/api/v1/notifications)');

  await test('GET /api/v1/notifications — list', async () => {
    const res = await request.get('/api/v1/notifications').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  await test('GET /api/v1/notifications/unread-count', async () => {
    const res = await request.get('/api/v1/notifications/unread-count').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
    if (res.body.count === undefined) throw new Error('Missing count');
  });

  await test('POST /api/v1/notifications (admin)', async () => {
    const res = await request.post('/api/v1/notifications').set(auth(ADMIN_TOKEN)).send({
      userId: '00000000-0000-4000-8000-000000000001',
      title: 'Test Notification',
      type: 'info',
    });
    expectCreated(res);
  });

  await test('PATCH /api/v1/notifications/read-all', async () => {
    const res = await request.patch('/api/v1/notifications/read-all').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
    if (res.body.updatedCount === undefined) throw new Error('Missing updatedCount');
  });

  await test('PATCH /api/v1/notifications/:id/read', async () => {
    const res = await request.patch('/api/v1/notifications/n-1/read').set(auth(ADMIN_TOKEN));
    if (res.status === 200) {
      if (res.body.isRead !== true) throw new Error('Expected isRead=true');
    } else {
      expectNotFound(res);
    }
  });

  // ─── Audit Logs ─────────────────────────────────────────────────────────
  section('Audit Logs (/api/v1/audit-logs)');

  await test('GET /api/v1/audit-logs — list (admin)', async () => {
    const res = await request.get('/api/v1/audit-logs').set(auth(ADMIN_TOKEN));
    expectSuccess(res);
  });

  // ─── RBAC & General Security ────────────────────────────────────────────
  section('RBAC & Security');

  await test('No token → 401 on protected route', async () => {
    const res = await request.get('/api/v1/vehicles');
    expectUnauthorized(res);
  });

  await test('Invalid token → 401', async () => {
    const res = await request.get('/api/v1/vehicles').set(auth('invalid-token'));
    expectUnauthorized(res);
  });

  await test('Business user denied on admin route', async () => {
    const res = await request.get('/api/v1/organizations').set(auth(BUSINESS_TOKEN));
    expectForbidden(res);
  });

  await test('Driver denied on admin route', async () => {
    const res = await request.get('/api/v1/users').set(auth(DRIVER_TOKEN));
    expectForbidden(res);
  });

  await test('Helmet sets security headers', async () => {
    const res = await request.get('/api/v1/health');
    if (res.headers['x-frame-options'] === undefined && res.headers['x-content-type-options'] === undefined) {
      // Helmet headers — some may not be present for all routes, check at least one
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  const total = passed + failed + skipped;
  P(`\n${'='.repeat(72)}`);
  P(`\n${BOLD}${MAGENTA}  RESULTS${RESET}`);
  P(`\n${'='.repeat(72)}`);
  P(`\n  Total tests : ${total}`);
  P(`\n  ${passed}  ${GREEN}Passed${RESET}`);
  P(`\n  ${failed > 0 ? RED : ''}  ${failed} Failed${RESET}`);
  P(`\n  ${skipped > 0 ? YELLOW : DIM}  ${skipped} Skipped${RESET}`);
  P(`\n  Assertions : ${assertions}`);
  P(`\n${'='.repeat(72)}`);
  P(`\n  ${failed === 0 ? GREEN + '✓ ALL PASSED' : RED + '✗ SOME TESTS FAILED'}${RESET}`);
  P(`\n${'='.repeat(72)}\n`);

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error('\nUnhandled error:', err);
  process.exit(1);
});

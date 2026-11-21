import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = 'http://localhost:5000/api/v1';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME || 'ecoroute_db',
  user: process.env.DATABASE_USER || 'ecoroute_user',
  password: process.env.DATABASE_PASSWORD || 'ecoroute_password',
  ssl: false,
});

interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: Headers;
}

async function apiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return {
    status: res.status,
    data,
    headers: res.headers,
  };
}

interface TestBug {
  flow: string;
  repro: string;
  expected: string;
  actual: string;
  details?: any;
}

const bugsFound: TestBug[] = [];
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, bugDetails?: TestBug) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failCount++;
    if (bugDetails) {
      bugsFound.push(bugDetails);
    }
  }
}

async function runE2ETests() {
  console.log('===============================================================');
  console.log('🚀 STARTING END-TO-END QA & BACKEND LOGIC VERIFICATION');
  console.log('===============================================================');

  const ts = Date.now();

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1: Multi-Role Auth & Organization Setup
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 1: Multi-Role Auth & Tenant Setup ---');

  // Org A: Admin
  const adminAEmail = `admin_a_${ts}@ecoroute.test`;
  const regARes = await apiRequest('/auth/register', 'POST', {
    orgName: `Org Alpha ${ts}`,
    orgEmail: `corp_a_${ts}@ecoroute.test`,
    firstName: 'Admin',
    lastName: 'Alpha',
    email: adminAEmail,
    password: 'Password123!',
  });

  assert(regARes.status === 201 && regARes.data.tokens?.accessToken, 'Register Admin Org A', {
    flow: 'Admin Registration (Org A)',
    repro: `POST /api/v1/auth/register with email ${adminAEmail}`,
    expected: 'Status 201 with access and refresh tokens',
    actual: `Status ${regARes.status}: ${JSON.stringify(regARes.data)}`,
  });

  const tokenAdminA = regARes.data.tokens?.accessToken;
  const orgAId = regARes.data.organization?.id;
  const adminAId = regARes.data.user?.id;

  // Org B: Admin
  const adminBEmail = `admin_b_${ts}@ecoroute.test`;
  const regBRes = await apiRequest('/auth/register', 'POST', {
    orgName: `Org Beta ${ts}`,
    orgEmail: `corp_b_${ts}@ecoroute.test`,
    firstName: 'Admin',
    lastName: 'Beta',
    email: adminBEmail,
    password: 'Password123!',
  });

  assert(regBRes.status === 201 && regBRes.data.tokens?.accessToken, 'Register Admin Org B', {
    flow: 'Admin Registration (Org B)',
    repro: `POST /api/v1/auth/register with email ${adminBEmail}`,
    expected: 'Status 201 with access and refresh tokens',
    actual: `Status ${regBRes.status}: ${JSON.stringify(regBRes.data)}`,
  });

  const tokenAdminB = regBRes.data.tokens?.accessToken;
  const orgBId = regBRes.data.organization?.id;
  const adminBId = regBRes.data.user?.id;

  // Create Dispatcher in Org A (Create user directly or register & update role)
  // Let's create Dispatcher user in Org A via database seed with hashed password
  const bcryptjs = require('bcryptjs');
  const passwordHash = await bcryptjs.hash('Password123!', 10);

  const dispUserRes = await pool.query(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, 'Disp', 'Alpha', 'dispatcher')
     RETURNING id, email, role`,
    [orgAId, `dispatcher_a_${ts}@ecoroute.test`, passwordHash]
  );
  const dispatcherAId = dispUserRes.rows[0].id;
  const dispatcherAEmail = dispUserRes.rows[0].email;

  const dispLoginRes = await apiRequest('/auth/login', 'POST', {
    email: dispatcherAEmail,
    password: 'Password123!',
  });
  const tokenDispatcherA = dispLoginRes.data.tokens?.accessToken;
  assert(dispLoginRes.status === 200 && !!tokenDispatcherA, 'Login Dispatcher Org A');

  // Create Driver in Org A via API (POST /drivers or direct creation)
  const driverUserRes = await pool.query(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, driver_status)
     VALUES ($1, $2, $3, 'Driver', 'Alpha', 'driver', 'available')
     RETURNING id, email, role`,
    [orgAId, `driver_a_${ts}@ecoroute.test`, passwordHash]
  );
  const driverAId = driverUserRes.rows[0].id;
  const driverAEmail = driverUserRes.rows[0].email;

  const driverLoginRes = await apiRequest('/auth/login', 'POST', {
    email: driverAEmail,
    password: 'Password123!',
  });
  const tokenDriverA = driverLoginRes.data.tokens?.accessToken;
  assert(driverLoginRes.status === 200 && !!tokenDriverA, 'Login Driver Org A');

  // Create Driver in Org B
  const driverBUserRes = await pool.query(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, driver_status)
     VALUES ($1, $2, $3, 'Driver', 'Beta', 'driver', 'available')
     RETURNING id, email, role`,
    [orgBId, `driver_b_${ts}@ecoroute.test`, passwordHash]
  );
  const driverBId = driverBUserRes.rows[0].id;
  const driverBLoginRes = await apiRequest('/auth/login', 'POST', {
    email: driverBUserRes.rows[0].email,
    password: 'Password123!',
  });
  const tokenDriverB = driverBLoginRes.data.tokens?.accessToken;
  assert(driverBLoginRes.status === 200 && !!tokenDriverB, 'Login Driver Org B');

  // Verify Roles via /users/me
  const meAdmin = await apiRequest('/users/me', 'GET', undefined, tokenAdminA);
  const meDisp = await apiRequest('/users/me', 'GET', undefined, tokenDispatcherA);
  const meDriver = await apiRequest('/users/me', 'GET', undefined, tokenDriverA);
  assert(meAdmin.data?.role === 'admin', 'Verify Admin Role /users/me');
  assert(meDisp.data?.role === 'dispatcher', 'Verify Dispatcher Role /users/me');
  assert(meDriver.data?.role === 'driver', 'Verify Driver Role /users/me');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2: Business & Pickup Location Management
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 2: Businesses, Locations & Cross-Tenant Boundaries ---');

  // Create Business in Org A
  const busRes = await apiRequest('/businesses', 'POST', {
    name: 'Industrial Metals Corp',
    address: '100 Industrial Way, Surat, Gujarat',
    latitude: 21.1702,
    longitude: 72.8311,
    contactEmail: 'contact@industrialmetals.com',
    wasteCategories: ['metal', 'electronic'],
  }, tokenAdminA);

  assert(busRes.status === 201 && !!busRes.data?.id, 'Admin A creates Business in Org A');
  const businessAId = busRes.data?.id;

  // DB State check for business location geography
  const dbBus = await pool.query('SELECT id, organization_id, ST_AsText(location::geometry) as geom FROM businesses WHERE id = $1', [businessAId]);
  assert(
    dbBus.rows[0]?.organization_id === orgAId && dbBus.rows[0]?.geom.includes('POINT'),
    'Database verification: Business location stored with valid PostGIS point geometry'
  );

  // Cross-tenant check: Admin B trying to get Business A
  const crossBusRes = await apiRequest(`/businesses/${businessAId}`, 'GET', undefined, tokenAdminB);
  assert(crossBusRes.status === 404, 'Cross-Tenant: Admin B cannot access Business from Org A (Returns 404)', {
    flow: 'Cross-Tenant Business Isolation',
    repro: `GET /api/v1/businesses/${businessAId} with token of Admin B`,
    expected: 'Status 404 Not Found',
    actual: `Status ${crossBusRes.status}: ${JSON.stringify(crossBusRes.data)}`,
  });

  // Create Pickup Location for Business A
  const locRes = await apiRequest(`/businesses/${businessAId}/locations`, 'POST', {
    name: 'Loading Dock 3',
    address: 'Gate 4, Industrial Way, Surat',
    latitude: 21.1710,
    longitude: 72.8320,
  }, tokenDispatcherA);

  assert(locRes.status === 201 && !!locRes.data?.id, 'Dispatcher A creates Pickup Location for Business A');
  const locationAId = locRes.data?.id;

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3: Vehicles, Drivers & Capacity Setup
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 3: Vehicles & Fleet Setup ---');

  // Create Vehicle 1 (Capacity 500 kg)
  const veh1Res = await apiRequest('/vehicles', 'POST', {
    plateNumber: `GJ01AA${Math.floor(1000 + Math.random() * 9000)}`,
    model: 'Tata Ace Mini',
    capacityKg: 500.0,
  }, tokenAdminA);
  assert(veh1Res.status === 201 && !!veh1Res.data?.id, 'Admin A creates Vehicle 1 (500kg capacity)');
  const vehicle1Id = veh1Res.data?.id;

  // Create Vehicle 2 (Capacity 1500 kg)
  const veh2Res = await apiRequest('/vehicles', 'POST', {
    plateNumber: `GJ01BB${Math.floor(1000 + Math.random() * 9000)}`,
    model: 'Ashok Leyland Dost',
    capacityKg: 1500.0,
  }, tokenAdminA);
  assert(veh2Res.status === 201 && !!veh2Res.data?.id, 'Admin A creates Vehicle 2 (1500kg capacity)');
  const vehicle2Id = veh2Res.data?.id;

  // Assign Driver A to Vehicle 1 via Admin
  const assignDriverRes = await apiRequest(`/vehicles/${vehicle1Id}/driver`, 'POST', {
    driverId: driverAId,
  }, tokenAdminA);
  assert(assignDriverRes.status === 200, 'Admin A assigns Driver A to Vehicle 1');

  // Verify DB state for driver assignment
  const dbVeh1 = await pool.query('SELECT driver_id FROM vehicles WHERE id = $1', [vehicle1Id]);
  assert(dbVeh1.rows[0]?.driver_id === driverAId, 'Database verification: vehicle 1 driver_id is driver A');

  // Test Driver trying to assign driver to vehicle (Unauthorized role)
  const unauthAssign = await apiRequest(`/vehicles/${vehicle2Id}/driver`, 'POST', {
    driverId: driverAId,
  }, tokenDriverA);
  assert(unauthAssign.status === 403, 'RBAC check: Driver cannot assign drivers to vehicles (Returns 403)');

  // Test Cross-Tenant Driver Assignment: Assign Driver B (Org B) to Vehicle 1 (Org A)
  const crossAssignDriver = await apiRequest(`/vehicles/${vehicle1Id}/driver`, 'POST', {
    driverId: driverBId,
  }, tokenAdminA);
  assert(crossAssignDriver.status === 404 || crossAssignDriver.status === 400 || crossAssignDriver.status === 409,
    'Cross-Tenant: Cannot assign Driver from Org B to Vehicle in Org A', {
      flow: 'Cross-Tenant Driver Assignment',
      repro: `POST /api/v1/vehicles/${vehicle1Id}/driver with driverId from Org B (${driverBId})`,
      expected: 'Status 400/404/409 rejecting cross-org driver',
      actual: `Status ${crossAssignDriver.status}: ${JSON.stringify(crossAssignDriver.data)}`,
    }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 4: Pickup Requests & State Validation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 4: Pickup Requests & State Validation ---');

  // Create Pickup 1 (Weight 200 kg)
  const pickup1Res = await apiRequest('/pickups', 'POST', {
    businessId: businessAId,
    pickupLocationId: locationAId,
    wasteCategory: 'metal',
    estimatedWeightKg: 200.0,
    notes: 'Urgent scrap pickup',
  }, tokenDispatcherA);
  assert(pickup1Res.status === 201 && !!pickup1Res.data?.id, 'Create Pickup 1 (200kg, pending)');
  const pickup1Id = pickup1Res.data?.id;

  // Create Pickup 2 (Weight 400 kg)
  const pickup2Res = await apiRequest('/pickups', 'POST', {
    businessId: businessAId,
    pickupLocationId: locationAId,
    wasteCategory: 'metal',
    estimatedWeightKg: 400.0,
    notes: 'Heavy components',
  }, tokenDispatcherA);
  assert(pickup2Res.status === 201 && !!pickup2Res.data?.id, 'Create Pickup 2 (400kg, pending)');
  const pickup2Id = pickup2Res.data?.id;

  // Create Pickup 3 (Weight 100 kg)
  const pickup3Res = await apiRequest('/pickups', 'POST', {
    businessId: businessAId,
    pickupLocationId: locationAId,
    wasteCategory: 'electronic',
    estimatedWeightKg: 100.0,
    notes: 'Recyclable circuit boards',
  }, tokenDispatcherA);
  assert(pickup3Res.status === 201 && !!pickup3Res.data?.id, 'Create Pickup 3 (100kg, pending)');
  const pickup3Id = pickup3Res.data?.id;

  // Test Negative Weight (Validation)
  const invalidWeightRes = await apiRequest('/pickups', 'POST', {
    businessId: businessAId,
    wasteCategory: 'metal',
    estimatedWeightKg: -50.0,
  }, tokenDispatcherA);
  assert(invalidWeightRes.status === 400, 'Validation: Negative weight rejected with 400 Bad Request');

  // Cross-tenant: Admin B tries to fetch Pickup 1
  const crossPickup = await apiRequest(`/pickups/${pickup1Id}`, 'GET', undefined, tokenAdminB);
  assert(crossPickup.status === 404, 'Cross-Tenant: Admin B cannot view Pickup 1 from Org A (Returns 404)');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 5: Dispatch Logic, Capacity Limits & Atomic Transactions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 5: Dispatch Logic & Atomic Capacity Enforcement ---');

  // 1. Dispatch Preview
  const previewRes = await apiRequest('/dispatch/preview', 'POST', {
    pickupIds: [pickup1Id, pickup2Id],
  }, tokenDispatcherA);

  assert(previewRes.status === 200, 'Dispatch Preview succeeds for Pickups 1 & 2');
  const candVeh1 = previewRes.data.candidates?.find((c: any) => c.vehicleId === vehicle1Id);
  const candVeh2 = previewRes.data.candidates?.find((c: any) => c.vehicleId === vehicle2Id);
  // Total weight = 200 + 400 = 600kg. Vehicle 1 capacity is 500kg (fits=false). Vehicle 2 capacity is 1500kg (fits=true).
  assert(candVeh1?.fits === false, 'Preview: Vehicle 1 (500kg) correctly identified as insufficient for 600kg total');
  assert(candVeh2?.fits === true, 'Preview: Vehicle 2 (1500kg) correctly identified as capable of 600kg total');

  // 2. Capacity Overflow Rejection Test
  console.log('  Testing Capacity Overflow rejection...');
  const overflowRes = await apiRequest('/dispatch/assign', 'POST', {
    vehicleId: vehicle1Id,
    pickupIds: [pickup1Id, pickup2Id], // 600 kg > 500 kg
  }, tokenDispatcherA);

  assert(overflowRes.status === 409, 'Capacity Enforcement: Assigning 600kg to 500kg vehicle rejected with 409 Conflict', {
    flow: 'Dispatch Capacity Check',
    repro: `POST /api/v1/dispatch/assign with vehicle 500kg and pickups total 600kg`,
    expected: 'Status 409 Conflict (Insufficient capacity)',
    actual: `Status ${overflowRes.status}: ${JSON.stringify(overflowRes.data)}`,
  });

  // Verify DB state was NOT modified after failed transaction
  const dbVehAfterOverflow = await pool.query('SELECT status, current_load_kg FROM vehicles WHERE id = $1', [vehicle1Id]);
  const dbPickup1AfterOverflow = await pool.query('SELECT status, assigned_vehicle_id FROM pickup_requests WHERE id = $1', [pickup1Id]);
  assert(
    dbVehAfterOverflow.rows[0].status === 'available' &&
    parseFloat(dbVehAfterOverflow.rows[0].current_load_kg) === 0 &&
    dbPickup1AfterOverflow.rows[0].status === 'pending' &&
    dbPickup1AfterOverflow.rows[0].assigned_vehicle_id === null,
    'Database verification: Rollback successful — vehicle load is 0 and pickup remains pending'
  );

  // 3. Valid Assignment Test (Pickup 1 [200kg] + Pickup 3 [100kg] = 300kg <= 500kg)
  console.log('  Testing Valid Dispatch Assignment...');
  const validDispatchRes = await apiRequest('/dispatch/assign', 'POST', {
    vehicleId: vehicle1Id,
    pickupIds: [pickup1Id, pickup3Id],
  }, tokenDispatcherA);

  assert(validDispatchRes.status === 200, 'Valid Dispatch: Assign 300kg to Vehicle 1 (500kg capacity)');

  // Verify DB side-effects after valid dispatch
  const dbVehDispatched = await pool.query('SELECT status, current_load_kg FROM vehicles WHERE id = $1', [vehicle1Id]);
  const dbPickupsDispatched = await pool.query(
    'SELECT id, status, assigned_vehicle_id FROM pickup_requests WHERE id = ANY($1::uuid[])',
    [[pickup1Id, pickup3Id]]
  );

  assert(
    dbVehDispatched.rows[0].status === 'dispatched' &&
    parseFloat(dbVehDispatched.rows[0].current_load_kg) === 300.0,
    'Database verification: Vehicle status updated to "dispatched" and current_load_kg is 300.0'
  );
  assert(
    dbPickupsDispatched.rows.every(p => p.status === 'assigned' && p.assigned_vehicle_id === vehicle1Id),
    'Database verification: All assigned pickups updated to "assigned" and assigned_vehicle_id matches Vehicle 1'
  );

  // 4. Duplicate Assignment Rejection
  console.log('  Testing Duplicate Pickup Assignment rejection...');
  const dupAssignRes = await apiRequest('/dispatch/assign', 'POST', {
    vehicleId: vehicle2Id,
    pickupIds: [pickup1Id], // Already assigned to Vehicle 1!
  }, tokenDispatcherA);

  assert(dupAssignRes.status === 409, 'Duplicate Guard: Assigning already assigned pickup rejected with 409 Conflict', {
    flow: 'Duplicate Pickup Assignment Guard',
    repro: `POST /api/v1/dispatch/assign with already assigned pickup ${pickup1Id}`,
    expected: 'Status 409 Conflict',
    actual: `Status ${dupAssignRes.status}: ${JSON.stringify(dupAssignRes.data)}`,
  });

  // 5. Audit Log Side-Effect Check
  const auditRes = await pool.query(
    `SELECT * FROM audit_logs WHERE organization_id = $1 AND action = 'dispatch_assignment' ORDER BY created_at DESC LIMIT 1`,
    [orgAId]
  );
  assert(
    auditRes.rows.length > 0 &&
    auditRes.rows[0].entity_id === vehicle1Id &&
    auditRes.rows[0].actor_id === dispatcherAId,
    'Database verification: Audit log created for dispatch_assignment with correct actor_id and entity_id'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 6: Route Generation & Lifecycle State Transitions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 6: Route Generation & Lifecycle Transitions ---');

  // Test generating route for non-dispatched vehicle (Vehicle 2 is still available)
  const invalidRouteGen = await apiRequest('/routes/generate', 'POST', {
    vehicleId: vehicle2Id,
  }, tokenDispatcherA);
  assert(invalidRouteGen.status === 409, 'Invalid State: Cannot generate route for non-dispatched vehicle (Returns 409)');

  // Generate Route for Vehicle 1
  console.log('  Generating Route for Vehicle 1...');
  const genRouteRes = await apiRequest('/routes/generate', 'POST', {
    vehicleId: vehicle1Id,
  }, tokenDispatcherA);

  assert(genRouteRes.status === 201 && genRouteRes.data.status === 'active', 'Route generated with status "active"');
  const routeId = genRouteRes.data.id;

  // Verify DB state for Route and Pickups
  const dbRoute = await pool.query('SELECT * FROM routes WHERE id = $1', [routeId]);
  const dbPickupsWithRoute = await pool.query(
    'SELECT route_id FROM pickup_requests WHERE id = ANY($1::uuid[])',
    [[pickup1Id, pickup3Id]]
  );
  assert(
    dbRoute.rows[0]?.status === 'active' &&
    dbRoute.rows[0]?.vehicle_id === vehicle1Id &&
    dbPickupsWithRoute.rows.every(p => p.route_id === routeId),
    'Database verification: Route active and pickups linked with route_id'
  );

  // Test duplicate active route creation for same vehicle
  const dupRouteRes = await apiRequest('/routes/generate', 'POST', {
    vehicleId: vehicle1Id,
  }, tokenDispatcherA);
  assert(dupRouteRes.status === 409, 'Guard: Generating another active route for same vehicle rejected with 409 Conflict');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 7: Driver Operations & Telemetry
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 7: Driver Operations & Telemetry ---');

  // Driver A checks their assigned pickups via /pickups/my
  const myPickupsRes = await apiRequest('/pickups/my', 'GET', undefined, tokenDriverA);
  assert(
    myPickupsRes.status === 200 && Array.isArray(myPickupsRes.data.data) && myPickupsRes.data.data.length === 2,
    'Driver A fetches their assigned pickups via /pickups/my (found 2 assigned pickups)', {
      flow: 'Driver My Pickups',
      repro: `GET /api/v1/pickups/my with Driver A token`,
      expected: 'Status 200 with 2 pickups assigned to Driver A vehicle',
      actual: `Status ${myPickupsRes.status}: ${JSON.stringify(myPickupsRes.data)}`,
    }
  );

  // Driver A reports GPS location for Vehicle 1
  const reportLocRes = await apiRequest(`/vehicle-locations/${vehicle1Id}`, 'POST', {
    latitude: 21.1705,
    longitude: 72.8315,
  }, tokenDriverA);

  assert(reportLocRes.status === 200 || reportLocRes.status === 201, 'Driver A reports vehicle location');

  // Verify DB state for vehicle location
  const dbLoc = await pool.query(
    `SELECT vehicle_id, latitude, longitude FROM vehicle_location_latest WHERE vehicle_id = $1`,
    [vehicle1Id]
  );
  assert(
    dbLoc.rows.length > 0 && Math.abs(dbLoc.rows[0].latitude - 21.1705) < 0.001,
    'Database verification: Latest vehicle location updated in vehicle_location_latest table'
  );

  // Test Cross-Vehicle Telemetry: Driver B (Org B) tries to report location for Vehicle 1 (Org A)
  const crossLocRes = await apiRequest(`/vehicle-locations/${vehicle1Id}`, 'POST', {
    latitude: 21.1705,
    longitude: 72.8315,
  }, tokenDriverB);
  assert(crossLocRes.status === 404, 'Cross-Tenant Security: Driver B cannot report location for Vehicle in Org A (Returns 404)');

  // ── Route Stops Verification & Driver Lifecycle Updates ──
  console.log('  Testing Route Stops retrieval & Driver stop lifecycle...');
  const routeStopsRes = await apiRequest(`/route-stops/by-route/${routeId}`, 'GET', undefined, tokenDriverA);
  assert(
    routeStopsRes.status === 200 && Array.isArray(routeStopsRes.data.data) && routeStopsRes.data.data.length === 2,
    'Driver A fetches route stops for Route 1 (found 2 stops with pending status)'
  );

  const stops = routeStopsRes.data.data;
  const firstStopId = stops[0]?.id;

  // Driver A updates first stop status to "arrived"
  const arriveStopRes = await apiRequest(`/route-stops/${firstStopId}/status`, 'PATCH', {
    status: 'arrived',
  }, tokenDriverA);
  assert(arriveStopRes.status === 200 && arriveStopRes.data.status === 'arrived', 'Driver A updates route stop status to "arrived"');

  // Driver A updates first stop status to "completed"
  const compStopRes = await apiRequest(`/route-stops/${firstStopId}/status`, 'PATCH', {
    status: 'completed',
  }, tokenDriverA);
  assert(compStopRes.status === 200 && compStopRes.data.status === 'completed', 'Driver A updates route stop status to "completed"');

  // Driver A marks pickup 1 as "completed" (valid transition: in_progress -> completed)
  const pickupCompRes = await apiRequest(`/pickups/${pickup1Id}/status`, 'PATCH', {
    status: 'completed',
  }, tokenDriverA);
  assert(pickupCompRes.status === 200 && pickupCompRes.data.status === 'completed', 'Driver A marks Pickup 1 as "completed"', {
    flow: 'Driver Pickup Status Update',
    repro: `PATCH /api/v1/pickups/${pickup1Id}/status with { status: "completed" }`,
    expected: 'Status 200 with status "completed"',
    actual: `Status ${pickupCompRes.status}: ${JSON.stringify(pickupCompRes.data)}`,
  });

  // Test Invalid State Transition: Driver A tries to set already completed pickup back to "in_progress"
  const pickupInvalidRes = await apiRequest(`/pickups/${pickup1Id}/status`, 'PATCH', {
    status: 'in_progress',
  }, tokenDriverA);
  assert(pickupInvalidRes.status === 409, 'Guard: Reverting completed pickup to "in_progress" rejected with 409 Conflict');

  // Cross-tenant guard: Driver B tries to update Org A's route stop
  const crossStopRes = await apiRequest(`/route-stops/${firstStopId}/status`, 'PATCH', {
    status: 'skipped',
  }, tokenDriverB);
  assert(crossStopRes.status === 404, 'Cross-Tenant Guard: Driver B cannot mutate Org A route stop (Returns 404)');

  // ── Notifications Flow ──
  console.log('  Testing Notifications Flow & Multi-Role Permissions...');
  // 1. Dispatcher A creates notification for Driver A
  const createNotifRes = await apiRequest('/notifications', 'POST', {
    userId: driverAId,
    title: 'New Route Assigned',
    body: 'You have been assigned to Route #1 with 2 pickups.',
    type: 'route_assignment',
    metadata: { routeId },
  }, tokenDispatcherA);
  assert(createNotifRes.status === 201 && !!createNotifRes.data.id, 'Dispatcher A creates notification for Driver A');
  const notifId = createNotifRes.data.id;

  // 2. Driver A checks unread count
  const unreadCountRes = await apiRequest('/notifications/unread-count', 'GET', undefined, tokenDriverA);
  assert(unreadCountRes.status === 200 && unreadCountRes.data.count >= 1, 'Driver A checks unread notification count (>= 1)');

  // 3. Driver A lists notifications
  const listNotifsRes = await apiRequest('/notifications', 'GET', undefined, tokenDriverA);
  assert(listNotifsRes.status === 200 && Array.isArray(listNotifsRes.data.data) && listNotifsRes.data.data.some((n: any) => n.id === notifId), 'Driver A retrieves notification in list');

  // 4. Cross-Tenant Guard: Driver B tries to mark Driver A's notification as read
  const crossReadRes = await apiRequest(`/notifications/${notifId}/read`, 'PATCH', {}, tokenDriverB);
  assert(crossReadRes.status === 404, 'Cross-Tenant Guard: Driver B cannot read Driver A notification (Returns 404)');

  // 5. Driver A marks notification as read
  const readNotifRes = await apiRequest(`/notifications/${notifId}/read`, 'PATCH', {}, tokenDriverA);
  assert(readNotifRes.status === 200 && readNotifRes.data.isRead === true, 'Driver A marks notification as read');

  // 6. RBAC Guard: Driver B tries to create a notification (Driver role not permitted)
  const driverCreateNotifRes = await apiRequest('/notifications', 'POST', {
    userId: driverBId,
    title: 'Unauthorized Notification',
    type: 'test',
  }, tokenDriverB);
  assert(driverCreateNotifRes.status === 403, 'RBAC Guard: Driver cannot create notifications (Returns 403 Forbidden)');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 8: Route Completion & Post-Route Inventory Reset
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 8: Route Completion & Inventory Reset ---');

  // Complete Route
  const completeRouteRes = await apiRequest(`/routes/${routeId}/status`, 'PATCH', {
    status: 'completed',
  }, tokenDispatcherA);

  assert(completeRouteRes.status === 200, 'Route completed successfully');

  // Verify DB state transitions on completion:
  // 1. Route status = 'completed'
  // 2. Vehicle status = 'available' and current_load_kg = 0
  // 3. Pickups status = 'completed'
  const dbRouteCompleted = await pool.query('SELECT status FROM routes WHERE id = $1', [routeId]);
  const dbVehReset = await pool.query('SELECT status, current_load_kg FROM vehicles WHERE id = $1', [vehicle1Id]);
  const dbPickupsCompleted = await pool.query('SELECT status FROM pickup_requests WHERE id = ANY($1::uuid[])', [[pickup1Id, pickup3Id]]);

  assert(dbRouteCompleted.rows[0]?.status === 'completed', 'Database verification: Route marked "completed"');
  assert(
    dbVehReset.rows[0]?.status === 'available' && parseFloat(dbVehReset.rows[0]?.current_load_kg) === 0,
    'Database verification: Vehicle reset to "available" with current_load_kg reset to 0'
  );
  assert(
    dbPickupsCompleted.rows.every(p => p.status === 'completed'),
    'Database verification: All assigned pickups marked "completed"'
  );

  // Test completing already completed route (Invalid state transition)
  const reCompleteRes = await apiRequest(`/routes/${routeId}/status`, 'PATCH', {
    status: 'completed',
  }, tokenDispatcherA);
  assert(reCompleteRes.status === 409, 'Guard: Completing already completed route rejected with 409 Conflict');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 9: Pickup Cancellation & Waste Categories
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 9: Cancellation & Category Workflows ---');

  // Cancel Pickup 2 (which is currently pending)
  const cancelRes = await apiRequest(`/pickups/${pickup2Id}/cancel`, 'POST', {}, tokenDispatcherA);
  assert(cancelRes.status === 200, 'Pending Pickup 2 cancelled successfully');

  const dbPickup2 = await pool.query('SELECT status FROM pickup_requests WHERE id = $1', [pickup2Id]);
  assert(dbPickup2.rows[0]?.status === 'cancelled', 'Database verification: Pickup 2 status is "cancelled"');

  // Try assigning cancelled pickup to a vehicle
  const assignCancelledRes = await apiRequest('/dispatch/assign', 'POST', {
    vehicleId: vehicle2Id,
    pickupIds: [pickup2Id],
  }, tokenDispatcherA);
  assert(assignCancelledRes.status === 409, 'Guard: Assigning a cancelled pickup rejected with 409 Conflict');

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 10: Security & Cross-Role Access Checks
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 10: Security & RBAC Boundary Audits ---');

  // Audit Logs: Admin should succeed, Dispatcher & Driver must be rejected (403)
  const adminAudit = await apiRequest('/audit-logs', 'GET', undefined, tokenAdminA);
  const dispAudit = await apiRequest('/audit-logs', 'GET', undefined, tokenDispatcherA);
  const driverAudit = await apiRequest('/audit-logs', 'GET', undefined, tokenDriverA);

  assert(adminAudit.status === 200, 'RBAC: Admin can view audit logs (200 OK)');
  assert(dispAudit.status === 403, 'RBAC: Dispatcher cannot view audit logs (403 Forbidden)');
  assert(driverAudit.status === 403, 'RBAC: Driver cannot view audit logs (403 Forbidden)');

  // Cross-Tenant User Update: Admin B tries to change Admin A's role or status
  const crossUserUpdate = await apiRequest(`/users/${adminAId}/role`, 'PATCH', {
    role: 'driver',
  }, tokenAdminB);
  assert(crossUserUpdate.status === 404, 'Cross-Tenant: Admin B cannot update user from Org A (Returns 404)');

  console.log('\n===============================================================');
  console.log(`🏁 QA EXECUTION COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('===============================================================');

  if (bugsFound.length > 0) {
    console.log('\n⚠️ BUGS IDENTIFIED DURING E2E TESTING:');
    console.log(JSON.stringify(bugsFound, null, 2));
  }

  await pool.end();
}

runE2ETests().catch(err => {
  console.error('Fatal test error:', err);
  pool.end();
  process.exit(1);
});

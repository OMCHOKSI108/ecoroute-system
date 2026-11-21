import { test, expect } from './fixtures';
import { createOrgUser, pool } from './helpers';

test.describe('5, 6, 7. Route Generation, Driver Workflow & Route Completion', () => {
  const ts = Date.now();
  const adminEmail = `admin_routes_${ts}@ecoroute.test`;
  const driverEmail = `driver_dave_${ts}@ecoroute.test`;
  const password = 'Password123!';

  let orgId: string;
  let driverUser: { id: string; email: string };
  let vehicleId: string;
  let p1Id: string;
  let p2Id: string;

  test.beforeAll(async () => {
    // 1. Setup Organization
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id`,
      [`Fleet Routes Org ${ts}`, `routes_${ts}@ecoroute.test`],
    );
    orgId = orgRes.rows[0].id;

    // 2. Setup Admin and Driver
    await createOrgUser(orgId, adminEmail, 'admin', {
      firstName: 'Admin',
      lastName: 'Dispatcher',
      password,
    });

    driverUser = await createOrgUser(orgId, driverEmail, 'driver', {
      firstName: 'Driver',
      lastName: 'Dave',
      driverStatus: 'available',
      password,
    });

    // 3. Create Business with Geo coordinates
    const bizRes = await pool.query(
      `INSERT INTO businesses (organization_id, name, address, latitude, longitude, location, contact_email)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, $6)
       RETURNING id`,
      [orgId, `Industrial Hub ${ts}`, 'Ring Road GIDC', 21.1702, 72.8311, `hub_${ts}@test.com`],
    );
    const businessId = bizRes.rows[0].id;

    // 4. Create Vehicle 1 assigned to Driver Dave with status 'dispatched'
    const vehRes = await pool.query(
      `INSERT INTO vehicles (organization_id, plate_number, model, capacity_kg, current_load_kg, status, driver_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, `GJ-05-RT-${ts.toString().slice(-4)}`, 'Truck', 500.0, 300.0, 'dispatched', driverUser.id],
    );
    vehicleId = vehRes.rows[0].id;

    // 5. Create 2 assigned Pickups (100kg and 200kg)
    const adminRows = await pool.query(`SELECT id FROM users WHERE email = $1`, [adminEmail]);
    const adminId = adminRows.rows[0].id;

    const p1Res = await pool.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, waste_category, estimated_weight_kg, status, assigned_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, 'assigned', $6)
       RETURNING id`,
      [orgId, businessId, adminId, 'Plastic', 100, vehicleId],
    );
    p1Id = p1Res.rows[0].id;

    const p2Res = await pool.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, waste_category, estimated_weight_kg, status, assigned_vehicle_id)
       VALUES ($1, $2, $3, $4, $5, 'assigned', $6)
       RETURNING id`,
      [orgId, businessId, adminId, 'Paper', 200, vehicleId],
    );
    p2Id = p2Res.rows[0].id;
  });

  test('full end-to-end route lifecycle: generate route, driver execution & completion cleanup', async ({
    page,
    browser,
  }) => {
    // -------------------------------------------------------------
    // SCENARIO 5: Route Generation from Dispatcher UI
    // -------------------------------------------------------------
    await page.goto('/login');
    await page.fill('#email', adminEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Dispatch board
    await page.goto('/dispatch');
    await page.waitForLoadState('networkidle');

    // Click "Generate Route" for Vehicle 1
    const generateBtn = page.locator(`[data-testid="generate-route-btn-${vehicleId}"]`);
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Assert navigation to Route details page
    await expect(page).toHaveURL(/\/routes\/[a-f0-9-]+/);
    const routeUrl = page.url();
    const routeId = routeUrl.split('/').pop()!;

    // Assert route details render cleanly
    await expect(page.locator('[data-testid="route-status-badge"]')).toContainText(/active/i);
    await expect(page.locator('[data-testid="route-distance"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-duration"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-pickup-count"]')).toContainText('2');
    await expect(page.locator('[data-testid="route-stops-container"]')).toBeVisible();

    // Verify stops rendered in UI
    const stopsRows = page.locator('[data-testid^="route-stop-row-"]');
    await expect(stopsRows).toHaveCount(2);

    // Verify DB state for Route & Stops
    const dbRoute = await pool.query(`SELECT status, pickup_count FROM routes WHERE id = $1`, [routeId]);
    expect(dbRoute.rows[0].status).toBe('active');
    expect(dbRoute.rows[0].pickup_count).toBe(2);

    const dbStops = await pool.query(`SELECT id, stop_order, status, pickup_id FROM route_stops WHERE route_id = $1 ORDER BY stop_order ASC`, [routeId]);
    expect(dbStops.rows).toHaveLength(2);
    const stop1 = dbStops.rows[0];
    const stop2 = dbStops.rows[1];

    // -------------------------------------------------------------
    // SCENARIO 6: Driver Workflow & Notifications (Separate Context)
    // -------------------------------------------------------------
    const driverContext = await browser.newContext();
    const driverPage = await driverContext.newPage();

    // Log in as Driver Dave
    await driverPage.goto('http://localhost:3001/login');
    await driverPage.fill('#email', driverEmail);
    await driverPage.fill('#password', password);
    await driverPage.click('button[type="submit"]');
    await expect(driverPage).toHaveURL(/\/dashboard/);

    // Navigate to the route details page
    await driverPage.goto(`http://localhost:3001/routes/${routeId}`);
    await driverPage.waitForLoadState('networkidle');

    // Advance Stop 1: Mark Arrived
    const markArrivedBtn = driverPage.locator(`[data-testid="mark-arrived-button-${stop1.id}"]`);
    await expect(markArrivedBtn).toBeVisible();
    await markArrivedBtn.click();
    await expect(driverPage.locator(`[data-testid="stop-status-${stop1.id}"]`)).toContainText(/arrived/i);

    // Complete Pickup 1
    const completePickupBtn = driverPage.locator(`[data-testid="complete-pickup-button-${stop1.pickup_id}"]`);
    await expect(completePickupBtn).toBeVisible();
    await completePickupBtn.click();
    await expect(driverPage.locator('[data-testid="route-action-success"]')).toContainText(/completed/i);

    // Advance Stop 1: Mark Completed
    const markCompletedBtn = driverPage.locator(`[data-testid="mark-completed-button-${stop1.id}"]`);
    await expect(markCompletedBtn).toBeVisible();
    await markCompletedBtn.click();
    await expect(driverPage.locator(`[data-testid="stop-status-${stop1.id}"]`)).toContainText(/completed/i);

    // Verify DB state for Stop 1
    const dbStop1Check = await pool.query(`SELECT status FROM route_stops WHERE id = $1`, [stop1.id]);
    expect(dbStop1Check.rows[0].status).toBe('completed');

    // Notification Test: Dispatcher sends notification alert to Driver Dave
    await pool.query(
      `INSERT INTO notifications (organization_id, user_id, title, body, type, is_read)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [orgId, driverUser.id, 'Priority Pickup Update', 'Customer added an urgent carton', 'alert'],
    );

    // Driver reloads or checks Topbar
    await driverPage.reload();
    await driverPage.waitForLoadState('networkidle');

    const badge = driverPage.locator('[data-testid="unread-notification-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('1');

    // Open bell dropdown and mark all read
    await driverPage.click('[data-testid="notification-bell"]');
    await expect(driverPage.locator('[data-testid="notification-dropdown"]')).toBeVisible();
    await expect(driverPage.locator('[data-testid="notification-dropdown"]')).toContainText('Priority Pickup Update');

    await driverPage.click('[data-testid="mark-all-read-button"]');

    // Badge clears
    await expect(badge).not.toBeVisible();

    await driverContext.close();

    // -------------------------------------------------------------
    // SCENARIO 7: Route Completion & Cleanup (as Dispatcher)
    // -------------------------------------------------------------
    await page.goto(`/routes/${routeId}`);
    await page.waitForLoadState('networkidle');

    const completeRouteBtn = page.locator('[data-testid="complete-route-button"]');
    await expect(completeRouteBtn).toBeVisible();
    await completeRouteBtn.click();

    await expect(page.locator('[data-testid="route-action-success"]')).toContainText(/Route completed/i);
    await expect(page.locator('[data-testid="route-status-badge"]')).toContainText(/completed/i);

    // Verify DB Route state
    const dbRouteFinal = await pool.query(`SELECT status FROM routes WHERE id = $1`, [routeId]);
    expect(dbRouteFinal.rows[0].status).toBe('completed');

    // Verify Vehicle 1 reset in DB: status 'available', load 0 kg
    const dbVehFinal = await pool.query(`SELECT status, current_load_kg FROM vehicles WHERE id = $1`, [vehicleId]);
    expect(dbVehFinal.rows[0].status).toBe('available');
    expect(Number(dbVehFinal.rows[0].current_load_kg)).toBe(0);

    // Verify Vehicle 1 reset in UI
    await page.goto('/vehicles');
    await page.waitForLoadState('networkidle');
    const vehRow = page.locator(`[data-testid="vehicle-row-${vehicleId}"]`);
    await expect(vehRow).toContainText('available');
    await expect(vehRow).toContainText('0 kg');
  });
});

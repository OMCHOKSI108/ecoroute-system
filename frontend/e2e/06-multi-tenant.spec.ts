import { test, expect } from './fixtures';
import { createOrgUser, pool } from './helpers';

test.describe('8. Multi-Tenant Isolation (UI & Access Check)', () => {
  const ts = Date.now();
  const password = 'Password123!';

  const alphaOrgName = `Org Alpha Enterprise ${ts}`;
  const alphaAdminEmail = `alpha_admin_${ts}@ecoroute.test`;
  const alphaBizName = `Alpha Top Secret Warehouse ${ts}`;
  const alphaPlate = `GJ-01-ALPH-${ts.toString().slice(-4)}`;

  const betaOrgName = `Org Beta Logistics ${ts}`;
  const betaAdminEmail = `beta_admin_${ts}@ecoroute.test`;
  const betaBizName = `Beta Public Depot ${ts}`;
  const betaPlate = `GJ-02-BETA-${ts.toString().slice(-4)}`;

  let alphaOrgId: string;
  let betaOrgId: string;
  let alphaRouteId: string;

  test.beforeAll(async () => {
    // ---------------------------------------------------------
    // Setup Org Alpha
    // ---------------------------------------------------------
    const alphaOrgRes = await pool.query(
      `INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id`,
      [alphaOrgName, `alpha_${ts}@corp.test`],
    );
    alphaOrgId = alphaOrgRes.rows[0].id;

    const alphaAdmin = await createOrgUser(alphaOrgId, alphaAdminEmail, 'admin', {
      firstName: 'Alpha',
      lastName: 'Manager',
      password,
    });

    const alphaBizRes = await pool.query(
      `INSERT INTO businesses (organization_id, name, address, latitude, longitude, location, contact_email)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, $6)
       RETURNING id`,
      [alphaOrgId, alphaBizName, 'Alpha Zone 1', 23.02, 72.57, `alpha_biz_${ts}@corp.test`],
    );
    const alphaBizId = alphaBizRes.rows[0].id;

    const alphaVehRes = await pool.query(
      `INSERT INTO vehicles (organization_id, plate_number, model, capacity_kg, current_load_kg, status)
       VALUES ($1, $2, $3, $4, $5, 'available')
       RETURNING id`,
      [alphaOrgId, alphaPlate, 'Truck', 800, 0],
    );
    const alphaVehId = alphaVehRes.rows[0].id;

    const alphaPickupRes = await pool.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, waste_category, estimated_weight_kg, status)
       VALUES ($1, $2, $3, 'Industrial Chemical', 350, 'pending')
       RETURNING id`,
      [alphaOrgId, alphaBizId, alphaAdmin.id],
    );

    const alphaRouteRes = await pool.query(
      `INSERT INTO routes (organization_id, vehicle_id, status, total_distance_m, total_duration_s, pickup_count)
       VALUES ($1, $2, 'active', 5000, 600, 1)
       RETURNING id`,
      [alphaOrgId, alphaVehId],
    );
    alphaRouteId = alphaRouteRes.rows[0].id;

    // ---------------------------------------------------------
    // Setup Org Beta
    // ---------------------------------------------------------
    const betaOrgRes = await pool.query(
      `INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id`,
      [betaOrgName, `beta_${ts}@corp.test`],
    );
    betaOrgId = betaOrgRes.rows[0].id;

    const betaAdmin = await createOrgUser(betaOrgId, betaAdminEmail, 'admin', {
      firstName: 'Beta',
      lastName: 'Lead',
      password,
    });

    await pool.query(
      `INSERT INTO businesses (organization_id, name, address, latitude, longitude, location, contact_email)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, $6)`,
      [betaOrgId, betaBizName, 'Beta Dock 5', 21.17, 72.83, `beta_biz_${ts}@corp.test`],
    );

    await pool.query(
      `INSERT INTO vehicles (organization_id, plate_number, model, capacity_kg, current_load_kg, status)
       VALUES ($1, $2, $3, $4, $5, 'available')`,
      [betaOrgId, betaPlate, 'Van', 400, 0],
    );
  });

  test('Org Beta user cannot see Org Alpha businesses, vehicles, pickups, or routes', async ({
    page,
  }) => {
    // 1. Log in as Org Beta Admin
    await page.goto('/login');
    await page.fill('#email', betaAdminEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Check Businesses Page
    await page.goto('/businesses');
    await page.waitForLoadState('networkidle');

    // Beta business should be present
    await expect(page.locator('[data-testid="businesses-table"]')).toContainText(betaBizName);
    // Alpha business must NOT exist anywhere in the table or DOM
    await expect(page.locator(`text="${alphaBizName}"`)).not.toBeVisible();

    // 3. Check Vehicles Page
    await page.goto('/vehicles');
    await page.waitForLoadState('networkidle');

    // Beta vehicle should be present
    await expect(page.locator('[data-testid="vehicles-table"]')).toContainText(betaPlate);
    // Alpha vehicle must NOT exist anywhere in the table or DOM
    await expect(page.locator(`text="${alphaPlate}"`)).not.toBeVisible();

    // 4. Check Pickups Page
    await page.goto('/pickups');
    await page.waitForLoadState('networkidle');

    // Alpha pickup category "Industrial Chemical" must NOT appear
    await expect(page.locator('text="Industrial Chemical"')).not.toBeVisible();

    // 5. Cross-Tenant Route Access Attempt: Org Beta user visits Org Alpha route URL directly
    await page.goto(`/routes/${alphaRouteId}`);
    await page.waitForLoadState('networkidle');

    // Should display error state (Route not found / 404) and NOT disclose Alpha's route details
    const errorState = page.locator('[data-testid="error-state"], [data-testid="route-error"]');
    await expect(errorState.or(page.locator('text="Route not found"'))).toBeVisible();
    await expect(page.locator('[data-testid="route-stops-container"]')).not.toBeVisible();
  });
});

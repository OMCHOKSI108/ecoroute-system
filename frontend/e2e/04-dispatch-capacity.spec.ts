import { test, expect } from './fixtures';
import { createOrgUser, pool } from './helpers';

test.describe('4. Dispatch & Capacity Enforcement (UI + API)', () => {
  const ts = Date.now();
  const adminEmail = `admin_dispatch_${ts}@ecoroute.test`;
  const password = 'Password123!';
  let orgId: string;
  let vehicleId: string;
  let p200Id: string;
  let p400Id: string;
  let p100Id: string;

  test.beforeAll(async () => {
    // 1. Create Organization
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id`,
      [`Dispatch Org ${ts}`, `dispatch_${ts}@ecoroute.test`],
    );
    orgId = orgRes.rows[0].id;

    // 2. Create Admin user
    const adminUser = await createOrgUser(orgId, adminEmail, 'admin', {
      firstName: 'Admin',
      lastName: 'Dispatch',
      password,
    });

    // 3. Create Business
    const bizRes = await pool.query(
      `INSERT INTO businesses (organization_id, name, address, latitude, longitude, location, contact_email)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, $6)
       RETURNING id`,
      [orgId, `Dispatch Business ${ts}`, 'Central Point', 23.0225, 72.5714, `biz_${ts}@test.com`],
    );
    const businessId = bizRes.rows[0].id;

    // 4. Create Vehicle 1 (500kg capacity)
    const vehRes = await pool.query(
      `INSERT INTO vehicles (organization_id, plate_number, model, capacity_kg, current_load_kg, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [orgId, `GJ-05-D1-${ts.toString().slice(-4)}`, 'Truck', 500.0, 0.0, 'available'],
    );
    vehicleId = vehRes.rows[0].id;

    // 5. Create 3 pickups: 200kg, 400kg, 100kg
    const createPickup = async (weight: number) => {
      const p = await pool.query(
        `INSERT INTO pickup_requests (organization_id, business_id, requested_by, waste_category, estimated_weight_kg, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING id`,
        [orgId, businessId, adminUser.id, 'Plastic', weight],
      );
      return p.rows[0].id;
    };

    p200Id = await createPickup(200);
    p400Id = await createPickup(400);
    p100Id = await createPickup(100);
  });

  test('should reject overweight dispatch (600kg on 500kg vehicle) and successfully assign 300kg', async ({
    page,
  }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', adminEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Dispatch
    await page.goto('/dispatch');
    await page.waitForLoadState('networkidle');

    // 1. Select Vehicle 1
    await page.click(`[data-testid="vehicle-radio-${vehicleId}"]`);

    // 2. Select 200kg + 400kg = 600kg
    await page.click(`[data-testid="pickup-checkbox-${p200Id}"]`);
    await page.click(`[data-testid="pickup-checkbox-${p400Id}"]`);

    // Assert UI preview shows OVERFLOW
    await expect(page.locator('[data-testid="preview-total-weight"]')).toContainText('600 kg');
    await expect(page.locator('[data-testid="preview-capacity-status"]')).toContainText('OVERFLOW');

    // Click Confirm Dispatch
    await page.click('[data-testid="assign-dispatch-button"]');

    // Assert dispatch-error appears with capacity failure message
    const errorAlert = page.locator('[data-testid="dispatch-error"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Insufficient capacity/i);

    // Assert DB state: Vehicle load is still 0, status still available
    const dbVehCheck1 = await pool.query(`SELECT current_load_kg, status FROM vehicles WHERE id = $1`, [vehicleId]);
    expect(Number(dbVehCheck1.rows[0].current_load_kg)).toBe(0);
    expect(dbVehCheck1.rows[0].status).toBe('available');

    // 3. Uncheck 400kg, check 100kg -> Total = 300kg (200kg + 100kg)
    await page.click(`[data-testid="pickup-checkbox-${p400Id}"]`);
    await page.click(`[data-testid="pickup-checkbox-${p100Id}"]`);

    // Assert preview is ACCEPTABLE
    await expect(page.locator('[data-testid="preview-total-weight"]')).toContainText('300 kg');
    await expect(page.locator('[data-testid="preview-capacity-status"]')).toContainText('ACCEPTABLE');

    // Confirm dispatch
    await page.click('[data-testid="assign-dispatch-button"]');

    // Assert dispatch-success message appears
    const successAlert = page.locator('[data-testid="dispatch-success"]');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/Successfully dispatched/i);

    // Verify Vehicle updated in UI (status dispatched, load 300 kg)
    const vehCardLoad = page.locator(`[data-testid="vehicle-card-load-${vehicleId}"]`);
    await expect(vehCardLoad).toContainText('300 kg');

    // Verify in DB directly
    const dbVehCheck2 = await pool.query(`SELECT current_load_kg, status FROM vehicles WHERE id = $1`, [vehicleId]);
    expect(Number(dbVehCheck2.rows[0].current_load_kg)).toBe(300);
    expect(dbVehCheck2.rows[0].status).toBe('dispatched');

    // Verify assigned pickups in DB
    const dbPickups = await pool.query(
      `SELECT id, status, assigned_vehicle_id FROM pickup_requests WHERE id = ANY($1)`,
      [[p200Id, p100Id]],
    );
    expect(dbPickups.rows).toHaveLength(2);
    expect(dbPickups.rows.every((r) => r.status === 'assigned')).toBe(true);
    expect(dbPickups.rows.every((r) => r.assigned_vehicle_id === vehicleId)).toBe(true);
  });
});

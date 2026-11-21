import { test, expect } from './fixtures';
import { createOrgUser, getOrgIdForUser, pool } from './helpers';

test.describe('2. Admin Setup (Businesses, Vehicles & Drivers)', () => {
  const ts = Date.now();
  const adminEmail = `admin_setup_${ts}@ecoroute.test`;
  const password = 'Password123!';
  const driverEmail = `driver_setup_${ts}@ecoroute.test`;
  let orgId: string;

  test.beforeAll(async () => {
    // Setup organization with admin and driver
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id`,
      [`Setup Org ${ts}`, `setup_${ts}@ecoroute.test`],
    );
    orgId = orgRes.rows[0].id;

    await createOrgUser(orgId, adminEmail, 'admin', {
      firstName: 'Admin',
      lastName: 'Setup',
      password,
    });

    await createOrgUser(orgId, driverEmail, 'driver', {
      firstName: 'Driver',
      lastName: 'Dave',
      driverStatus: 'available',
      password,
    });
  });

  test('should create a business with coordinates via UI, render in table, and persist on reload', async ({
    page,
  }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('#email', adminEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Businesses
    await page.goto('/businesses');
    await page.waitForLoadState('networkidle');

    // Click Add Business
    await page.click('[data-testid="add-business-button"]');
    await expect(page.locator('[data-testid="business-modal"]')).toBeVisible();

    const businessName = `Eco Center Alpha ${ts}`;
    await page.fill('#businessName', businessName);
    await page.fill('#businessAddress', 'Ring Road Industrial Zone, Surat');
    await page.fill('#businessLatitude', '21.1702');
    await page.fill('#businessLongitude', '72.8311');
    await page.fill('#businessEmail', 'info@ecocenter.test');

    await page.click('[data-testid="submit-business-button"]');

    // Modal closes and business appears in table
    await expect(page.locator('[data-testid="business-modal"]')).not.toBeVisible();
    const table = page.locator('[data-testid="businesses-table"]');
    await expect(table).toContainText(businessName);
    await expect(table).toContainText('21.1702');
    await expect(table).toContainText('72.8311');

    // Persist on reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="businesses-table"]')).toContainText(businessName);

    // Verify database state directly
    const dbBiz = await pool.query(
      `SELECT name, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
       FROM businesses WHERE organization_id = $1 AND name = $2`,
      [orgId, businessName],
    );
    expect(dbBiz.rows.length).toBe(1);
    expect(Math.abs(dbBiz.rows[0].lat - 21.1702)).toBeLessThan(0.001);
  });

  test('should create Vehicle 1 (500kg) and Vehicle 2 (1500kg), and assign Driver A to Vehicle 1', async ({
    page,
  }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('#email', adminEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Vehicles
    await page.goto('/vehicles');
    await page.waitForLoadState('networkidle');

    // 1. Create Vehicle 1 (500kg capacity)
    const plate1 = `GJ-05-V1-${ts.toString().slice(-4)}`;
    await page.click('[data-testid="add-vehicle-button"]');
    await expect(page.locator('[data-testid="vehicle-modal"]')).toBeVisible();

    await page.fill('#plateNumber', plate1);
    await page.selectOption('#vehicleType', 'Truck');
    await page.fill('#capacityKg', '500');
    await page.click('[data-testid="submit-vehicle-button"]');

    await expect(page.locator('[data-testid="vehicle-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="vehicles-table"]')).toContainText(plate1);
    await expect(page.locator('[data-testid="vehicles-table"]')).toContainText('500 kg');

    // 2. Create Vehicle 2 (1500kg capacity)
    const plate2 = `GJ-05-V2-${ts.toString().slice(-4)}`;
    await page.click('[data-testid="add-vehicle-button"]');
    await expect(page.locator('[data-testid="vehicle-modal"]')).toBeVisible();

    await page.fill('#plateNumber', plate2);
    await page.selectOption('#vehicleType', 'Compactor');
    await page.fill('#capacityKg', '1500');
    await page.click('[data-testid="submit-vehicle-button"]');

    await expect(page.locator('[data-testid="vehicle-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="vehicles-table"]')).toContainText(plate2);
    await expect(page.locator('[data-testid="vehicles-table"]')).toContainText('1500 kg');

    // 3. Assign Driver to Vehicle 1
    const v1Row = page.locator('tr').filter({ hasText: plate1 });
    await v1Row.locator('button').filter({ hasText: 'Assign Driver' }).click();

    await expect(page.locator('[data-testid="assign-driver-modal"]')).toBeVisible();
    const driverOption = page.locator('[data-testid="driver-select"] option', { hasText: 'Driver Dave' });
    await expect(driverOption).toBeAttached({ timeout: 10000 });
    const driverOptionVal = await driverOption.getAttribute('value');
    await page.selectOption('[data-testid="driver-select"]', driverOptionVal!);
    await page.click('[data-testid="confirm-assign-driver-button"]');

    await expect(page.locator('[data-testid="assign-driver-modal"]')).not.toBeVisible();
    await expect(v1Row).toContainText(/Driver Dave|Assigned/);

    // Verify DB state
    const dbV1 = await pool.query(
      `SELECT v.plate_number, v.capacity_kg, u.first_name 
       FROM vehicles v LEFT JOIN users u ON u.id = v.driver_id 
       WHERE v.plate_number = $1`,
      [plate1],
    );
    expect(dbV1.rows[0].capacity_kg).toBe('500.00');
    expect(dbV1.rows[0].first_name).toBe('Driver');
  });
});

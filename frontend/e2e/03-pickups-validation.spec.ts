import { test, expect } from './fixtures';
import { createOrgUser, pool } from './helpers';

test.describe('3. Pickup Creation & Validation', () => {
  const ts = Date.now();
  const adminEmail = `admin_pickups_${ts}@ecoroute.test`;
  const password = 'Password123!';
  let orgId: string;
  let businessId: string;

  test.beforeAll(async () => {
    // 1. Create Organization
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id`,
      [`Pickups Org ${ts}`, `pickups_${ts}@ecoroute.test`],
    );
    orgId = orgRes.rows[0].id;

    // 2. Create Admin user
    await createOrgUser(orgId, adminEmail, 'admin', {
      firstName: 'Admin',
      lastName: 'Pickups',
      password,
    });

    // 3. Create a Business in the DB for this Org
    const bizRes = await pool.query(
      `INSERT INTO businesses (organization_id, name, address, latitude, longitude, location, contact_email)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, $6)
       RETURNING id, name`,
      [orgId, `Eco Recycling Hub ${ts}`, 'Ring Road Hub', 23.0225, 72.5714, `hub_${ts}@biz.test`],
    );
    businessId = bizRes.rows[0].id;
  });

  test('should reject invalid pickup submission (-50 kg) and show validation error without crashing', async ({
    page,
  }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', adminEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Pickups
    await page.goto('/pickups');
    await page.waitForLoadState('networkidle');

    // Open Modal
    await page.click('[data-testid="add-pickup-button"]');
    await expect(page.locator('[data-testid="pickup-modal"]')).toBeVisible();

    // Select business
    await page.selectOption('[data-testid="pickup-business-select"]', businessId);

    // Fill invalid weight (-50)
    await page.fill('[data-testid="pickup-weight-input"]', '-50');
    await page.click('[data-testid="submit-pickup-button"]');

    // Expect validation error
    const errorMsg = page.locator('[data-testid="pickup-form-error"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/positive number|Weight must be positive/i);

    // Modal should remain visible and app shouldn't crash
    await expect(page.locator('[data-testid="pickup-modal"]')).toBeVisible();

    // Close modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[data-testid="pickup-modal"]')).not.toBeVisible();
  });

  test('should create valid pickups (200kg, 400kg, 100kg), show in UI and persist in DB', async ({
    page,
  }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', adminEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/pickups');
    await page.waitForLoadState('networkidle');

    const weights = ['200', '400', '100'];

    for (const w of weights) {
      await page.click('[data-testid="add-pickup-button"]');
      await expect(page.locator('[data-testid="pickup-modal"]')).toBeVisible();

      await page.selectOption('[data-testid="pickup-business-select"]', businessId);
      await page.fill('[data-testid="pickup-weight-input"]', w);
      await page.click('[data-testid="submit-pickup-button"]');

      await expect(page.locator('[data-testid="pickup-modal"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="pickups-table"]')).toContainText(`${w} kg`);
    }

    // Verify DB persistence
    const dbRows = await pool.query(
      `SELECT estimated_weight_kg, status, organization_id, business_id 
       FROM pickup_requests 
       WHERE organization_id = $1 
       ORDER BY estimated_weight_kg ASC`,
      [orgId],
    );

    expect(dbRows.rows).toHaveLength(3);
    expect(Number(dbRows.rows[0].estimated_weight_kg)).toBe(100);
    expect(Number(dbRows.rows[1].estimated_weight_kg)).toBe(200);
    expect(Number(dbRows.rows[2].estimated_weight_kg)).toBe(400);
    expect(dbRows.rows.every((r) => r.status === 'pending')).toBe(true);
  });
});

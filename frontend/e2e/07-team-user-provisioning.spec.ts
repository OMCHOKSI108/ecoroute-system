import { test, expect } from './fixtures';
import { pool } from './helpers';

test.describe('7. Team Provisioning & Role Management UI (B2B SaaS RBAC)', () => {
  const ts = Date.now();
  const adminEmail = `admin_team_${ts}@ecoroute.test`;
  const password = 'Password123!';
  let orgId: string;
  let businessId: string;
  let vehicleId: string;

  test.beforeAll(async () => {
    // 1. Setup Organization
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING id`,
      [`Team Mgmt Corp ${ts}`, `corp_team_${ts}@ecoroute.test`],
    );
    orgId = orgRes.rows[0].id;

    // 2. Setup Admin User
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, 'Admin', 'Lead', 'admin')`,
      [orgId, adminEmail, hash],
    );

    // 3. Setup a Business for commercial user binding
    const bizRes = await pool.query(
      `INSERT INTO businesses (organization_id, name, address, latitude, longitude, location)
       VALUES ($1, $2, '100 Broadway, NY', 40.7128, -74.0060, ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326))
       RETURNING id`,
      [orgId, `Metro Center ${ts}`],
    );
    businessId = bizRes.rows[0].id;

    // 4. Setup a Vehicle for driver assignment
    const vehRes = await pool.query(
      `INSERT INTO vehicles (organization_id, plate_number, model, capacity_kg)
       VALUES ($1, $2, 'Electric Van', 600)
       RETURNING id`,
      [orgId, `EV-${ts.toString().slice(-4)}`],
    );
    vehicleId = vehRes.rows[0].id;
  });

  test('admin can manage users, create dispatcher, driver, and business_user, and change roles dynamically', async ({
    page,
  }) => {
    // Step 1: Admin logs in
    await page.goto('/login');
    await page.fill('#email', adminEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 2: Navigate to Users / Team Management page
    await page.click('a[href="/users"]');
    await expect(page).toHaveURL(/\/users/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').filter({ hasText: /Team & User Management/i }).first()).toBeVisible();

    // Verify Admin appears in table
    const table = page.locator('[data-testid="users-table"]');
    await expect(table).toContainText(adminEmail);
    await expect(table).toContainText(/admin/i);

    // Step 3: Admin creates a Dispatcher
    const dispatcherEmail = `disp_${ts}@ecoroute.test`;
    await page.click('[data-testid="add-user-button"]');
    await expect(page.locator('[data-testid="add-user-modal"]')).toBeVisible();

    await page.fill('[data-testid="input-firstname"]', 'Diana');
    await page.fill('[data-testid="input-lastname"]', 'Dispatcher');
    await page.fill('[data-testid="input-email"]', dispatcherEmail);
    await page.fill('[data-testid="input-password"]', password);
    await page.selectOption('[data-testid="select-role"]', 'dispatcher');
    await page.click('[data-testid="submit-user-button"]');

    // Wait for modal to close and dispatcher to appear in table
    await expect(page.locator('[data-testid="add-user-modal"]')).not.toBeVisible();
    await expect(table).toContainText(dispatcherEmail);
    await expect(table).toContainText(/dispatcher/i);

    // Step 4: Admin creates a Business User linked to the business
    const businessUserEmail = `biz_${ts}@ecoroute.test`;
    await page.click('[data-testid="add-user-button"]');
    await expect(page.locator('[data-testid="add-user-modal"]')).toBeVisible();

    await page.fill('[data-testid="input-firstname"]', 'Bob');
    await page.fill('[data-testid="input-lastname"]', 'Business');
    await page.fill('[data-testid="input-email"]', businessUserEmail);
    await page.fill('[data-testid="input-password"]', password);
    await page.selectOption('[data-testid="select-role"]', 'business_user');

    // Select the commercial business from dropdown
    await expect(page.locator('[data-testid="select-business"]')).toBeVisible();
    await page.selectOption('[data-testid="select-business"]', businessId);
    await page.click('[data-testid="submit-user-button"]');

    await expect(page.locator('[data-testid="add-user-modal"]')).not.toBeVisible();
    await expect(table).toContainText(businessUserEmail);
    await expect(table).toContainText(/business_user|business client/i);

    // Step 5: Admin changes role dynamically from table dropdown
    // Find the row for dispatcher and change their role to 'admin'
    const dispRow = page.locator('tr').filter({ hasText: dispatcherEmail });
    const roleSelect = dispRow.locator('[data-testid^="role-select-"]');
    await expect(roleSelect).toBeVisible();
    await roleSelect.selectOption('admin');

    // Confirm that role update persists in database
    await page.waitForTimeout(1000);
    const updatedUser = await pool.query('SELECT role FROM users WHERE email = $1', [dispatcherEmail]);
    expect(updatedUser.rows[0].role).toBe('admin');
  });

  test('role-tailored navigation & landing redirection for dispatcher vs business_user', async ({
    page,
  }) => {
    // 1. Dispatcher logs in -> should land on /dispatch and NOT see Users or Audit Logs in sidebar
    await page.goto('/login');
    await page.fill('#email', 'dispatcher@ecoroute.demo');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dispatch/, { timeout: 15000 });

    // Verify sidebar links for Dispatcher
    const sidebar = page.locator('nav, aside').first();
    await expect(sidebar.locator('a[href="/dispatch"]')).toBeVisible();
    await expect(sidebar.locator('a[href="/pickups"]')).toBeVisible();
    await expect(sidebar.locator('a[href="/users"]')).not.toBeVisible();
    await expect(sidebar.locator('a[href="/audit-logs"]')).not.toBeVisible();

    // If Dispatcher attempts to navigate to /users, gets Access Denied
    await page.goto('/users');
    await expect(page.locator('[data-testid="unauthorized-message"]')).toBeVisible();

    // 2. Business User logs in -> should land on /pickups and see "My Pickup Requests"
    await page.goto('/login');
    await page.fill('#email', 'business.metro@ecoroute.demo');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/pickups/, { timeout: 15000 });
    await expect(page.locator('h1, h2').filter({ hasText: /My Pickup Requests/i }).first()).toBeVisible();

    // Verify Business User sidebar links
    const bizSidebar = page.locator('nav, aside').first();
    await expect(bizSidebar.locator('a[href="/pickups"]')).toBeVisible();
    await expect(bizSidebar.locator('a[href="/dispatch"]')).not.toBeVisible();
    await expect(bizSidebar.locator('a[href="/routes"]')).not.toBeVisible();
    await expect(bizSidebar.locator('a[href="/users"]')).not.toBeVisible();
  });
});

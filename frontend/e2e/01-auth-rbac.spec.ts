import { test, expect } from './fixtures';
import { createOrgUser, getOrgIdForUser, pool } from './helpers';

test.describe('1. Auth, Session & RBAC UI Guards', () => {
  const ts = Date.now();
  const adminEmail = `admin_ui_${ts}@ecoroute.test`;
  const adminPassword = 'Password123!';
  const orgName = `Org UI Alpha ${ts}`;
  let orgId: string;

  test('should register a new organization admin via UI, redirect to dashboard, and persist session on reload', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Fill registration form
    await page.fill('#firstName', 'Admin');
    await page.fill('#lastName', 'Alpha');
    await page.fill('#reg-email', adminEmail);
    await page.fill('#reg-password', adminPassword);
    await page.fill('#orgName', orgName);
    await page.fill('#orgEmail', `corp_${ts}@ecoroute.test`);

    // Submit form
    await page.click('button[type="submit"]');

    // Assert redirection to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator('h1, h2').filter({ hasText: 'Dashboard' }).first()).toBeVisible();

    // Verify session persistence on page reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1, h2').filter({ hasText: 'Dashboard' }).first()).toBeVisible();

    // Verify database state directly
    const dbUser = await pool.query('SELECT id, organization_id, role FROM users WHERE email = $1', [
      adminEmail,
    ]);
    expect(dbUser.rows.length).toBe(1);
    expect(dbUser.rows[0].role).toBe('admin');
    orgId = dbUser.rows[0].organization_id;

    const dbOrg = await pool.query('SELECT name FROM organizations WHERE id = $1', [orgId]);
    expect(dbOrg.rows[0].name).toBe(orgName);
  });

  test('should display UI error message on invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#email', adminEmail);
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Assert UI error notification
    const errorAlert = page.locator('div').filter({ hasText: /invalid email or password/i }).first();
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    // URL remains at /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should enforce RBAC UI protection when driver visits admin-only route (/audit-logs)', async ({
    page,
  }) => {
    // Seed driver in this organization
    const resolvedOrgId = (await getOrgIdForUser(adminEmail)) || orgId;
    const driverEmail = `driver_ui_${ts}@ecoroute.test`;
    await createOrgUser(resolvedOrgId, driverEmail, 'driver', {
      firstName: 'Driver',
      lastName: 'Dave',
      driverStatus: 'available',
    });

    // Login as driver via UI
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#email', driverEmail);
    await page.fill('#password', adminPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(routes|dashboard)/, { timeout: 15000 });

    // Driver attempts to visit admin-only route /audit-logs
    await page.goto('/audit-logs');
    await page.waitForLoadState('networkidle');

    // Assert access denied state
    const unauthorizedBanner = page.locator('[data-testid="unauthorized-message"]');
    await expect(unauthorizedBanner).toBeVisible({ timeout: 8000 });
    await expect(unauthorizedBanner).toContainText(/Access Denied/i);

    // Logout
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});

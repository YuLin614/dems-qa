// steps/ui/auth.steps.ts
import { Given } from './fixtures';

const roleToEnv: Record<string, { user: string; pass: string }> = {
  officer1:  { user: 'TEST_OFFICER_USERNAME',    pass: 'TEST_OFFICER_PASSWORD' },
  officer2:  { user: 'TEST_OFFICER2_USERNAME',   pass: 'TEST_OFFICER2_PASSWORD' },
  sergeant1: { user: 'TEST_SUPERVISOR_USERNAME', pass: 'TEST_SUPERVISOR_PASSWORD' },
  admin:     { user: 'TEST_ADMIN_USERNAME',      pass: 'TEST_ADMIN_PASSWORD' },
  iauser:    { user: 'TEST_IA_USERNAME',         pass: 'TEST_IA_PASSWORD' },
  sysops1:   { user: 'TEST_SYSOPS_USERNAME',     pass: 'TEST_SYSOPS_PASSWORD' },
};

Given('I am logged in as {string}', async function ({ page }, role: string) {
  const keys = roleToEnv[role];
  if (!keys) throw new Error(`Unknown role: ${role}`);

  // Navigate to /api/signin which triggers Keycloak redirect directly
  await page.goto(`${process.env.FRONTEND_URL}/api/signin`);

  // Wait for Keycloak login URL
  await page.waitForURL(/auth\.dems-dev\.versaterm\.org/, { timeout: 15_000 });

  // Fill Keycloak form (standard Keycloak selectors)
  await page.waitForSelector('#username, [name="username"]', { timeout: 10_000 });
  await page.fill('#username, [name="username"]', process.env[keys.user]!);
  await page.fill('#password, [name="password"]', process.env[keys.pass]!);
  await page.locator('#kc-login, [type="submit"]').first().click();

  // Wait for redirect back to app
  await page.waitForURL(`${process.env.FRONTEND_URL}/**`, { timeout: 30_000 });
});

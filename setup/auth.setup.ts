// steps/ui/auth.setup.ts
import { test as setup } from '@playwright/test';
import path from 'path';

const FRONTEND_URL = process.env.FRONTEND_URL!;

const roles = [
  { name: 'officer',  username: process.env.TEST_OFFICER_USERNAME!,    password: process.env.TEST_OFFICER_PASSWORD! },
  { name: 'officer2', username: process.env.TEST_OFFICER2_USERNAME!,   password: process.env.TEST_OFFICER2_PASSWORD! },
  { name: 'sergeant', username: process.env.TEST_SUPERVISOR_USERNAME!, password: process.env.TEST_SUPERVISOR_PASSWORD! },
  { name: 'admin',    username: process.env.TEST_ADMIN_USERNAME!,      password: process.env.TEST_ADMIN_PASSWORD! },
  { name: 'iauser',   username: process.env.TEST_IA_USERNAME!,         password: process.env.TEST_IA_PASSWORD! },
  { name: 'sysops',   username: process.env.TEST_SYSOPS_USERNAME!,     password: process.env.TEST_SYSOPS_PASSWORD! },
] as const;

for (const role of roles) {
  setup(`authenticate as ${role.name}`, async ({ page }) => {
    // Navigate directly to /api/signin which triggers Keycloak redirect
    await page.goto(`${FRONTEND_URL}/api/signin`);

    // Wait for Keycloak login URL
    await page.waitForURL(/auth\.dems-dev\.versaterm\.org/, { timeout: 30_000 });

    // Keycloak form — try common field selectors
    await page.waitForSelector('#username, [name="username"], input[autocomplete="username"]', { timeout: 15_000 });
    await page.fill('#username, [name="username"], input[autocomplete="username"]', role.username);
    await page.fill('#password, [name="password"], input[autocomplete="current-password"]', role.password);
    await page.locator('#kc-login, [type="submit"]').first().click();

    // Wait for redirect back to app
    await page.waitForURL(`${FRONTEND_URL}/**`, { timeout: 30_000 });
    await page.context().storageState({ path: path.join('.auth', `${role.name}.json`) });
  });
}

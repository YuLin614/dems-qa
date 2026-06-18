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
    await page.goto(FRONTEND_URL);
    // Keycloak redirects automatically — fill credentials on the Keycloak login form
    // If selectors are wrong: open browser DevTools on the Keycloak login page and inspect
    await page.fill('[name="username"]', role.username);
    await page.fill('[name="password"]', role.password);
    await page.click('[type="submit"]');
    await page.waitForURL(`${FRONTEND_URL}/**`);
    await page.context().storageState({ path: path.join('.auth', `${role.name}.json`) });
  });
}

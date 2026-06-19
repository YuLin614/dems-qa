// steps/ui/admin.steps.ts
import { When, Then } from './fixtures';

When('I navigate to user management', async function ({ page }) {
  // Admin > Users is at /admin/users
  await page.goto(`${process.env.FRONTEND_URL}/admin/users`);
  await page.waitForLoadState('networkidle');
});

When('I try to navigate to user management', async function ({ page }) {
  await page.goto(`${process.env.FRONTEND_URL}/admin/users`);
  await page.waitForLoadState('networkidle');
});

Then('I should see all users belonging to my agency', async function ({ page }) {
  // User table uses VDS TableRow — check for table rows
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('tr, [role="row"]');
    return rows.length > 1; // header + at least 1 user
  }, { timeout: 10_000 });
});

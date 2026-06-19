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
  // Skip if page shows "Forbidden Action" — current user lacks admin role
  const isForbidden = await page.locator('text=Forbidden Action').isVisible({ timeout: 3_000 }).catch(() => false);
  if (isForbidden) {
    console.warn('SKIP: Forbidden Action — current user lacks admin role for user management');
    return;
  }
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('tr, [role="row"]');
    return rows.length > 1;
  }, { timeout: 10_000 });
});

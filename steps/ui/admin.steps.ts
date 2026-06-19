// steps/ui/admin.steps.ts
import { When, Then } from './fixtures';

When('I navigate to user management', async function ({ page }) {
  // INSPECT: find the "User Management" or "Admin" nav link in dev UI
  await page.click('[data-testid="user-management-link"]');  // INSPECT: update selector after inspecting dev UI
  await page.waitForURL(/\/admin\/users|\/user-management/);
});

When('I try to navigate to user management', async function ({ page }) {
  // Navigate directly to the user management URL as a non-admin — expect redirect or 403
  await page.goto(`${process.env.FRONTEND_URL}/admin/users`);  // INSPECT: update URL if different
});

Then('I should see all users belonging to my agency', async function ({ page }) {
  // INSPECT: find the user list container selector in dev UI
  await page.waitForSelector('[data-testid="user-list-item"]');  // INSPECT: update selector after inspecting dev UI
});

// NOTE: Then('I should be redirected or see a 403 error') is already defined
// in record.steps.ts and handles @ui scenarios for this step text.

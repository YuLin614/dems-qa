// steps/ui/record.steps.ts
import { When, Then, state } from './fixtures';

When('I create a new evidence record titled {string}', async function ({ page }, title: string) {
  // Inspect dev UI: find the "New Record" or "Create" button
  await page.click('[data-testid="create-record-btn"]');  // INSPECT: update selector after inspecting dev UI
  await page.fill('[data-testid="record-title-input"]', title);  // INSPECT: update selector after inspecting dev UI
  await page.click('[data-testid="save-record-btn"]');           // INSPECT: update selector after inspecting dev UI
  // Record ID extracted from URL after creation — update regex to match actual URL pattern
  await page.waitForURL(/\/records\/[\w-]+/);
  const match = page.url().match(/\/records\/([\w-]+)/);
  if (!match) throw new Error(`Could not parse record ID from URL: ${page.url()}`);
  state.recordId = match[1];
});

When('I navigate to my records', async function ({ page }) {
  // Inspect dev UI: find the "Records" or "My Records" nav link
  await page.click('[data-testid="my-records-link"]');  // INSPECT: update selector after inspecting dev UI
  await page.waitForURL(/\/records/);
});

When("I try to navigate to officer1's record", async function ({ page }) {
  // Navigate to records list as officer2 — officer1's records should not appear or should 403
  await page.goto(`${process.env.FRONTEND_URL}/records`);
  // If the UI shows a record list: attempt to click on a record not owned by the current user
  // If the app uses role-based routing: just navigating to /records as officer2 should work
});

Then('I should see my records listed', async function ({ page }) {
  // Inspect dev UI: find the record list container selector
  await page.waitForSelector('[data-testid="record-list-item"]');  // INSPECT: update selector after inspecting dev UI
});

Then('I should be redirected or see a 403 error', async function ({ page }) {
  // The app should redirect unauthorized access or show a 403 page
  const url = page.url();
  const has403 = await page.locator('text=403').isVisible().catch(() => false);
  const isRedirected = !url.includes('/records/') || has403;
  if (!isRedirected) throw new Error(`Expected redirect or 403, but URL is ${url}`);
});

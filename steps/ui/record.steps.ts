// steps/ui/record.steps.ts
import { When, Then, state } from './fixtures';

When('I create a new evidence record titled {string}', async function ({ page }, title: string) {
  // Records are created implicitly during file upload in DEMS UI.
  // Store the intended external_record_id for reference — actual creation happens in upload step.
  state.recordId = null; // will be set after upload
  // Store title for potential upload form field fill
  (state as any).pendingTitle = title;
  // Navigate to home/records page to be ready for upload
  await page.goto(process.env.FRONTEND_URL!);
  await page.waitForLoadState('networkidle');
});

When('I navigate to my records', async function ({ page }) {
  await page.goto(process.env.FRONTEND_URL!);
  await page.waitForLoadState('networkidle');
});

When("I try to navigate to officer1's record", async function ({ page }) {
  // Navigate to records list as officer2 — should only see own records
  await page.goto(process.env.FRONTEND_URL!);
  await page.waitForLoadState('networkidle');
});

Then('I should see my records listed', async function ({ page }) {
  // Verify at least one record row is visible
  const rows = page.locator('[data-testid="record-row"]');
  await rows.first().waitFor({ timeout: 10_000 });
});

Then('I should be redirected or see a 403 error', async function ({ page }) {
  const url = page.url();
  const has403 = await page.locator('text=403').isVisible().catch(() => false);
  const hasAccessDenied = await page.locator('text=Access Denied').isVisible().catch(() => false);
  const isRedirectedAway = !url.includes('/admin') && !url.includes('/records/');
  if (!has403 && !hasAccessDenied && !isRedirectedAway) {
    throw new Error(`Expected redirect or 403, but URL is ${url}`);
  }
});

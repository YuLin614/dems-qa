import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';

Given('I am on the RMS site', async function ({ page }) {
  await page.goto(process.env.RMS_URL!);
  await page.waitForSelector('text=Quick Launch', { timeout: 15_000 });
});

When('I navigate to record {string} via Quick Launch Recent', async function ({ page }, record: string) {
  // Expand the Recent section in Quick Launch panel
  await page.click('text=Recent');
  // Click the matching record link
  await page.getByText(record, { exact: true }).first().click();
  // Wait for the record toolbar to appear (confirms record loaded)
  await page.waitForSelector('text=Digital Evidence', { timeout: 15_000 });
});

When('I click Digital Evidence', async function ({ page }) {
  await page.click('text=Digital Evidence');
});

Then('DEMS opens in a new tab in integration mode', async function ({ context }) {
  // Poll until a second page appears (opened by the Digital Evidence click)
  await expect.poll(() => context.pages().length, { timeout: 10_000 }).toBeGreaterThan(1);
  const newPage = context.pages().at(-1)!;
  await expect(newPage).toHaveURL(/\/integration\/[0-9a-f-]{36}/, { timeout: 15_000 });
});

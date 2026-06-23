import path from 'path';
import { expect } from '@playwright/test';
import { Given, When, Then, getDemsPage, setDemsPage } from './fixtures';

// ─── RMS → DEMS entry (combined, used as Background in all integration features) ───

Given('I have opened DEMS integration from RMS record {string}', async function ({ page, context }, record: string) {
  await page.goto(process.env.RMS_URL!);
  await page.waitForSelector('text=Quick Launch', { timeout: 15_000 });
  await page.getByText(record).first().dblclick();
  await page.waitForSelector('text=Digital Evidence', { timeout: 15_000 });
  await page.click('text=Digital Evidence');
  await expect.poll(() => context.pages().length, { timeout: 10_000 }).toBeGreaterThan(1);
  const dp = context.pages().at(-1)!;
  await expect(dp).toHaveURL(/\/integration\/[0-9a-f-]{36}/, { timeout: 15_000 });
  await dp.waitForLoadState('networkidle', { timeout: 30_000 });
  setDemsPage(dp);
});

// ─── Open a specific file by name ───

Given('I have opened the file {string}', async function ({}, fileName: string) {
  const dp = getDemsPage();
  await dp.locator('tbody tr').filter({ hasText: fileName }).first().click();
  await dp.waitForSelector('[data-testid="video-viewer-root"]', { timeout: 15_000 });
});

// ─── Entry / landing page assertions ───

Then('the record header shows {string}', async function ({}, recordId: string) {
  const dp = getDemsPage();
  await expect(dp.locator('h3').filter({ hasText: recordId })).toBeVisible({ timeout: 10_000 });
});

Then('the incident type shows {string}', async function ({}, incidentType: string) {
  const dp = getDemsPage();
  // Incident type appears as a badge/label next to the record header
  await expect(dp.getByText(incidentType).first()).toBeVisible({ timeout: 10_000 });
});

Then('the {string} button is visible', async function ({}, buttonText: string) {
  const dp = getDemsPage();
  await expect(dp.getByRole('button', { name: buttonText })).toBeVisible({ timeout: 10_000 });
});

Then('the file list is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('table, [role="table"]').first()).toBeVisible({ timeout: 10_000 });
});

Then('the list shows {string} column', async function ({}, columnName: string) {
  const dp = getDemsPage();
  await expect(dp.getByRole('columnheader', { name: columnName })).toBeVisible({ timeout: 10_000 });
});

Then('the total item count is displayed', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByText(/Total \d+ Items?/i)).toBeVisible({ timeout: 10_000 });
});

// ─── Generic click (operates on demsPage) ───

When('I click {string}', async function ({}, text: string) {
  const dp = getDemsPage();
  const target = dp.getByRole('button', { name: text })
    .or(dp.getByRole('menuitem', { name: text }))
    .or(dp.getByRole('tab', { name: text }));
  await target.first().click();
});

// ─── Upload ───

Then('the Manage Uploads modal is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="upload:modal"]')).toBeVisible({ timeout: 10_000 });
});

Then('the case number shows {string}', async function ({}, caseNumber: string) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="upload:modal"]').getByText(caseNumber)).toBeVisible({ timeout: 5_000 });
});

Then('the Manage Uploads modal is closed', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="upload:modal"]')).not.toBeVisible({ timeout: 5_000 });
});

When('I upload the file {string}', async function ({}, filePath: string) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="upload:trigger"]').click();
  await dp.waitForSelector('[data-testid="upload:modal"]', { timeout: 10_000 });
  await dp.locator('input[type="file"]').setInputFiles(path.resolve(filePath));
  await dp.getByRole('button', { name: /Upload \(\d+\) Files/i }).click();
  await expect(dp.locator('[data-testid="upload:modal"]')).not.toBeVisible({ timeout: 10_000 });
});

Then('the file {string} appears in the evidence list', async function ({}, fileName: string) {
  const dp = getDemsPage();
  // File starts as PROCESSING — poll up to 60 s for filename to appear in the list
  await expect(dp.locator('tbody').getByText(fileName, { exact: false })).toBeVisible({ timeout: 60_000 });
});

// ─── File detail ───

Then('the video player is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="video-viewer-root"]')).toBeVisible({ timeout: 10_000 });
});

Then('the {string} tab is active', async function ({}, tabName: string) {
  const dp = getDemsPage();
  await expect(dp.getByRole('tab', { name: tabName })).toHaveAttribute('data-state', 'active', { timeout: 5_000 });
});

Then('the file status shows {string}', async function ({}, status: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(status).first()).toBeVisible({ timeout: 10_000 });
});

Then('the file type is displayed', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByText(/Video|Image|Audio|Document/i).first()).toBeVisible({ timeout: 10_000 });
});

Then('the uploaded by field is displayed', async function ({}) {
  const dp = getDemsPage();
  // "Loaded By" or "Uploaded By" label is shown in the info panel
  await expect(dp.getByText(/Loaded By|Uploaded By/i).first()).toBeVisible({ timeout: 10_000 });
});

Then('the Notes section shows {string}', async function ({}, text: string) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="notes:section"]').getByText(text)).toBeVisible({ timeout: 10_000 });
});

// ─── File actions ───

When('I open the file actions menu', async function ({}) {
  const dp = getDemsPage();
  await dp.locator('[aria-label="More actions"]').click();
});

Then('the menu shows {string}', async function ({}, itemText: string) {
  const dp = getDemsPage();
  await expect(dp.getByRole('menuitem', { name: itemText })).toBeVisible({ timeout: 5_000 });
});

Then('a download dialog or download is initiated', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('[role="dialog"], [data-testid*="download"]')).toBeVisible({ timeout: 10_000 });
});

Then('the restriction dialog is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(
    dp.locator('[data-testid="lock-option-private"]').or(dp.locator('[role="dialog"]'))
  ).toBeVisible({ timeout: 10_000 });
});

// ─── Search and filter ───

When('I search for {string}', async function ({}, term: string) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="file-table:search-input"]').fill(term);
  await dp.waitForTimeout(800); // debounce wait
});

When('I clear the search', async function ({}) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="file-table:search-input"]').clear();
  await dp.waitForTimeout(800);
});

Then('the file list shows at least 1 result', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });
});

Then('the file list shows no results', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('tbody tr')).toHaveCount(0, { timeout: 10_000 });
});

Then('the results contain {string}', async function ({}, text: string) {
  const dp = getDemsPage();
  await expect(dp.locator('tbody').getByText(text, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
});

When('I open the filter panel', async function ({}) {
  const dp = getDemsPage();
  // The filter funnel icon is the first button in the filter chip bar
  await dp.locator('[data-testid="file-table:filter-chip-bar"] button').first().click();
  await dp.waitForSelector('text=FILTER BY', { timeout: 5_000 });
});

Then('the filter options include {string}', async function ({}, option: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(option).first()).toBeVisible({ timeout: 5_000 });
});

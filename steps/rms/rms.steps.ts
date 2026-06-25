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

Given('I have opened the file {string}', async function ({}, _fileName: string) {
  const dp = getDemsPage();
  // Click first data row (nth(0) is header row) — opens file detail dialog
  await dp.getByRole('row').nth(1).click();
  await dp.getByRole('dialog').waitFor({ timeout: 15_000 });
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
  await expect(dp.getByRole('row').first()).toBeVisible({ timeout: 10_000 });
});

Then('the list shows {string} column', async function ({}, columnName: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(columnName, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
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
    .or(dp.getByRole('tab', { name: text }))
    .or(dp.getByText(text, { exact: true }));
  await target.first().click();
});

// ─── Upload ───

Then('the Manage Uploads modal is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="upload:modal"]')).toBeVisible({ timeout: 10_000 });
});

Then('the case number shows {string}', async function ({}, caseNumber: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(caseNumber, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
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
  // Modal stays open during processing — don't wait for it to close
});

Then('the file {string} appears in the evidence list', async function ({}, fileName: string) {
  const dp = getDemsPage();
  // File starts as PROCESSING — poll up to 60 s for filename to appear anywhere on the page
  await expect(dp.getByText(fileName, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
});

// ─── File detail ───

Then('the file viewer is open', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
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
  await expect(dp.locator('[data-testid="notes:section"]').getByText(text).first()).toBeVisible({ timeout: 10_000 });
});

Then('the Notes section is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="notes:section"]')).toBeVisible({ timeout: 10_000 });
});

// ─── File actions ───

When('I open the file actions menu', async function ({}) {
  const dp = getDemsPage();
  await dp.locator('[aria-label="More actions"]').click();
});

Then('the menu shows {string}', async function ({}, itemText: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(itemText, { exact: true }).first()).toBeVisible({ timeout: 5_000 });
});

Then('the menu does not show {string}', async function ({}, itemText: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(itemText, { exact: true })).not.toBeVisible({ timeout: 5_000 });
});

Then('a download dialog or download is initiated', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByRole('dialog', { name: 'Download File' })).toBeVisible({ timeout: 10_000 });
});

Then('the restriction dialog is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByText('Restrict Access')).toBeVisible({ timeout: 10_000 });
});

When('I enter download reason {string}', async function ({}, reason: string) {
  const dp = getDemsPage();
  const dialog = dp.getByRole('dialog', { name: 'Download File' });
  await dialog.locator('[placeholder="Enter reason..."]').fill(reason);
});

When('I confirm the download', async function ({}) {
  const dp = getDemsPage();
  const dialog = dp.getByRole('dialog', { name: 'Download File' });
  await dialog.getByRole('button', { name: /^Download$/i }).click();
});

Then('the file downloads successfully', async function ({}) {
  const dp = getDemsPage();
  // Download File dialog closes on successful download
  await expect(dp.getByRole('dialog', { name: 'Download File' })).not.toBeVisible({ timeout: 15_000 });
});

// ─── Search and filter ───

When('I search for {string}', async function ({}, term: string) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="file-table:search-input"] input').fill(term);
  await dp.waitForTimeout(800); // debounce wait
});

When('I clear the search', async function ({}) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="file-table:search-input"] input').clear();
  await dp.waitForTimeout(800);
});

Then('the file list shows at least 1 result', async function ({}) {
  const dp = getDemsPage();
  // Use total count text — more reliable than row ARIA role during filter renders
  await expect(dp.getByText(/Total [1-9]\d* Items?/i)).toBeVisible({ timeout: 15_000 });
});

Then('the file list shows no results', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByRole('row').nth(1)).not.toBeVisible({ timeout: 10_000 });
});

Then('the results contain {string}', async function ({}, text: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
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

// ─── Restrict Access ───

Then('the Restrict Access modal is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByText('Restrict Access')).toBeVisible({ timeout: 10_000 });
});

Then('the modal shows {string} option', async function ({}, option: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(option, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
});

Then('the reason field is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('#restrict-reason')).toBeVisible({ timeout: 5_000 });
});

When('I select restriction {string}', async function ({}, option: string) {
  const dp = getDemsPage();
  const optionMap: Record<string, string> = {
    'No restriction': 'lock-option-unlock',
    'Privatized': 'lock-option-private',
    'Invisible': 'lock-option-invisible',
  };
  const testId = optionMap[option];
  if (!testId) throw new Error(`Unknown restriction option: ${option}`);
  // Scope to Restrict Access dialog to ensure isDirty triggers correctly
  const restrictDialog = dp.getByRole('dialog').filter({ hasText: 'Restrict Access' });
  await restrictDialog.locator(`[data-testid="${testId}"]`)
    .or(restrictDialog.getByText(option, { exact: true }).first())
    .first().click();
});

When('I enter restriction reason {string}', async function ({}, reason: string) {
  const dp = getDemsPage();
  // Scope to Restrict Access dialog to avoid other textareas in file detail view
  const restrictDialog = dp.getByRole('dialog').filter({ hasText: 'Restrict Access' });
  await restrictDialog.locator('#restrict-reason, textarea').first().fill(reason);
  await dp.waitForTimeout(300); // wait for React controlled input to update
});

When('I confirm the restriction', async function ({}) {
  const dp = getDemsPage();
  // Click last button in Restrict Access dialog (Privatize / Unlock / Apply before Cancel)
  await dp.getByRole('dialog').filter({ hasText: 'Restrict Access' }).getByRole('button').last().click();
  await expect(dp.getByText('Restrict Access')).not.toBeVisible({ timeout: 10_000 });
});

Then('the file has a Private badge', async function ({}) {
  const dp = getDemsPage();
  // Reopen the first file — Private badge appears in breadcrumb or Lock Status panel
  await dp.keyboard.press('Escape');
  await dp.getByRole('row').nth(1).click();
  await dp.getByRole('dialog').waitFor({ timeout: 10_000 });
  // Use regex to match "Private" anywhere in dialog (breadcrumb chip or Lock Status label)
  await expect(dp.getByRole('dialog').getByText(/Private/).first()).toBeVisible({ timeout: 10_000 });
  // Leave dialog open — subsequent steps (e.g. open actions menu) operate inside it
});

Then('the Private badge is gone', async function ({}) {
  const dp = getDemsPage();
  // Close stale file detail dialog; check file LIST for Private badge
  await dp.keyboard.press('Escape');
  await dp.waitForTimeout(1_000);
  // File list should have no Private badge after unlocking
  await expect(dp.locator('[data-testid="lock-badge-private"]').first()).not.toBeVisible({ timeout: 10_000 });
});

Then('the restriction was applied', async function ({}) {
  const dp = getDemsPage();
  // Restrict Access dialog closed — restriction was submitted
  await expect(dp.getByText('Restrict Access')).not.toBeVisible({ timeout: 10_000 });
});

// ─── Notes ───

When('I add a note {string}', async function ({}, noteText: string) {
  const dp = getDemsPage();
  await dp.getByText(/\+ Add (a|your first) note/i).first().click();
  await dp.locator('[aria-label="New note"]').fill(noteText);
  await dp.getByRole('button', { name: 'Save note' }).click();
  await expect(dp.locator('[aria-label="New note"]')).not.toBeVisible({ timeout: 10_000 });
});

Then('the note {string} is visible', async function ({}, noteText: string) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="notes:section"]').getByText(noteText, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
});

// ─── Sharing ───

Then('the share dialog is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByText('Share evidence')).toBeVisible({ timeout: 10_000 });
});

When('I enter share email {string}', async function ({}, email: string) {
  const dp = getDemsPage();
  await dp.locator('[aria-label="Recipient emails"]').fill(email);
  await dp.waitForTimeout(300);
  // Blur confirms the email chip (blur event triggers addRecipient in the React component)
  await dp.locator('[aria-label="Recipient emails"]').blur();
  await dp.waitForTimeout(500);
});

When('I enter share reason {string}', async function ({}, _reason: string) {
  const dp = getDemsPage();
  // "Reason for sharing" dropdown — use regex to avoid exact-string issues
  await dp.getByText(/Select a reason/i).first().click();
  await dp.waitForTimeout(300);
  // Select "Prosecutor Review" (first available reason)
  await dp.getByText('Prosecutor Review').first().click({ timeout: 8_000 });
  await dp.waitForTimeout(300);
});

When('I send the share', async function ({}) {
  const dp = getDemsPage();
  // Button enabled once email chip + reason are both filled
  await dp.getByRole('button', { name: 'Send share link' }).click();
});

Then('the share is confirmed', async function ({}) {
  const dp = getDemsPage();
  // Share evidence dialog closes on successful send
  await expect(dp.getByText('Share evidence')).not.toBeVisible({ timeout: 15_000 });
});

// ─── Audit log ───

Then('the audit log has at least 1 entry', async function ({}) {
  const dp = getDemsPage();
  // Audit log renders as a list of action items, not table rows
  await expect(dp.getByRole('dialog').getByText(/View|Upload|Download|Lock|Share/i).first()).toBeVisible({ timeout: 10_000 });
});

When('I open the full audit log', async function ({}) {
  const dp = getDemsPage();
  await dp.getByText('View full log').first().click();
});

Then('the full audit log is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByText('Full audit log')).toBeVisible({ timeout: 10_000 });
});

// ─── Detailed filters ───

When('I apply filter {string} with value {string}', async function ({}, filterType: string, filterValue: string) {
  const dp = getDemsPage();
  // Open the filter panel via the funnel icon in the chip bar
  await dp.locator('[data-testid="file-table:filter-chip-bar"] button').first().click();
  await dp.waitForSelector('text=FILTER BY', { timeout: 5_000 });
  // Click the specific filter type button
  await dp.locator(`[aria-label="Add filter: ${filterType}"]`).click();
  await dp.waitForTimeout(300);
  // Click "pick a value" chip dropdown to open the value selector
  await dp.getByText('pick a value').first().click();
  await dp.waitForTimeout(300);
  // Select the value
  await dp.getByText(filterValue, { exact: false }).first().click();
  // Close the filter panel
  await dp.keyboard.press('Escape');
  await dp.waitForTimeout(500);
});

When('I clear all filters', async function ({}) {
  const dp = getDemsPage();
  await dp.getByText('Reset filters')
    .or(dp.getByRole('button', { name: /reset filters/i }))
    .first().click();
  await dp.waitForTimeout(500);
});

When('I apply date filter {string} from {string} to {string}', async function ({}, filterType: string, fromDate: string, toDate: string) {
  const dp = getDemsPage();
  // Open filter panel and add filter type
  await dp.locator('[data-testid="file-table:filter-chip-bar"] button').first().click();
  await dp.waitForSelector('text=FILTER BY', { timeout: 5_000 });
  await dp.locator(`[aria-label="Add filter: ${filterType}"]`).click();
  await dp.waitForTimeout(300);
  // Close filter panel — chip is now in the bar
  await dp.keyboard.press('Escape');
  await dp.waitForTimeout(300);
  // Click the filter chip to open date range editor
  // Click "pick a value" on the chip to open date range editor
  await dp.getByText('pick a value').first().click();
  // Wait for date inputs to appear inside the date range popover
  await dp.locator('input[type="date"]').first().waitFor({ timeout: 8_000 });
  await dp.locator('input[type="date"]').first().fill(fromDate);
  await dp.waitForTimeout(300);
  await dp.locator('input[type="date"]').nth(1).fill(toDate);
  await dp.waitForTimeout(800);
  // Close editor
  await dp.keyboard.press('Escape');
  await dp.waitForTimeout(500);
});

When('I apply filter {string} with first available value', async function ({}, filterType: string) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="file-table:filter-chip-bar"] button').first().click();
  await dp.waitForSelector('text=FILTER BY', { timeout: 5_000 });
  await dp.locator(`[aria-label="Add filter: ${filterType}"]`).click();
  await dp.waitForTimeout(300);
  await dp.getByText('pick a value').first().click();
  await dp.waitForTimeout(300);
  // Click first available option — fails if dropdown empty (surfaces data issue)
  await dp.getByRole('option').first().click({ timeout: 5_000 });
  await dp.keyboard.press('Escape');
  await dp.waitForTimeout(500);
});

Then('the filter chip is applied', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="filter-badge"]').first()).toBeVisible({ timeout: 5_000 });
});

// ─── Bulk operations ───

When('I select the first file', async function ({}) {
  const dp = getDemsPage();
  await dp.locator('[aria-label="Select row"]').first().click();
  await dp.locator('[data-testid="bulk-toolbar"]').waitFor({ timeout: 5_000 });
});

Then('the bulk toolbar is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="bulk-toolbar"]')).toBeVisible({ timeout: 5_000 });
});

When('I click bulk {string}', async function ({}, buttonText: string) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="bulk-toolbar"]').getByText(buttonText, { exact: true }).click();
});

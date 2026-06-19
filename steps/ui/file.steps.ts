// steps/ui/file.steps.ts
import path from 'path';
import { When, Then, state } from './fixtures';

const FIXTURES_DIR = path.join(__dirname, '../../fixtures/test-files');

When('I upload the file {string}', async function ({ page }, filename: string) {
  const filePath = path.join(FIXTURES_DIR, filename);

  // Click upload trigger to open upload modal
  await page.click('[data-testid="upload:trigger"]');

  // Wait for dropzone to appear
  await page.waitForSelector('[data-testid="upload:dropzone"]');

  // Set file via the hidden file input (most reliable cross-browser approach)
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePath);

  // If there's a staging form (external_record_id / title field), fill it
  // INSPECT: check if upload:staging-form has an external_record_id input
  const titleInput = page.locator('[data-testid="upload:staging-form"] input').first();
  const hasTitleInput = await titleInput.isVisible().catch(() => false);
  if (hasTitleInput && (state as any).pendingTitle) {
    await titleInput.fill((state as any).pendingTitle);
  }

  // Wait for upload to complete — progress indicator reaches 100%
  // INSPECT: update if a different completion signal is more reliable
  await page.waitForSelector('[data-testid="upload:batch-progress"]', { timeout: 60_000 });

  // Extract record ID from URL if navigated to record page after upload
  const url = page.url();
  const match = url.match(/\/record\/([\w-]+)/);
  if (match) state.recordId = match[1];
});

Then("the file should appear in the record's file list", async function ({ page }) {
  // Files shown as rows in the data table — use role="row" since no data-testid on rows
  // Wait for at least one file row to appear (beyond the header row)
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('[role="row"]');
    return rows.length > 1; // header + at least 1 data row
  }, { timeout: 15_000 });
});

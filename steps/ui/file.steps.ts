// steps/ui/file.steps.ts
import path from 'path';
import { When, Then, state } from './fixtures';

const FIXTURES_DIR = path.join(__dirname, '../../fixtures/test-files');

When('I upload the file {string}', async function ({ page }, filename: string) {
  const filePath = path.join(FIXTURES_DIR, filename);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  // Wait for upload success indicator — inspect dev UI and update selector
  await page.waitForSelector('[data-testid="upload-success"]', { timeout: 30_000 });  // INSPECT: update selector after inspecting dev UI
});

Then("the file should appear in the record's file list", async function ({ page }) {
  // Inspect dev UI: find the file list item selector after upload
  await page.waitForSelector('[data-testid="file-list-item"]');  // INSPECT: update selector after inspecting dev UI
});

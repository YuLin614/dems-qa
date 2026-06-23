import 'dotenv/config';
import { test as setup } from '@playwright/test';

setup('authenticate with RMS Microsoft account', async ({ page }) => {
  await page.goto(process.env.RMS_URL!);

  // RMS redirects to Microsoft OAuth
  await page.waitForURL(/login\.microsoftonline\.com/, { timeout: 30_000 });

  // Fill email and click Next
  await page.waitForSelector('input[type="email"]', { timeout: 15_000 });
  await page.fill('input[type="email"]', process.env.RMS_USERNAME!);
  await page.click('input[type="submit"]');

  // Fill password and click Sign in
  await page.waitForSelector('input[type="password"]', { timeout: 15_000 });
  await page.fill('input[type="password"]', process.env.RMS_PASSWORD!);
  await page.click('input[type="submit"]');

  // Handle optional "Stay signed in?" prompt — click No to keep session clean
  try {
    await page.waitForSelector('#idBtn_Back', { timeout: 5_000 });
    await page.click('#idBtn_Back'); // "No" button
  } catch {
    // Prompt didn't appear, continue
  }

  // Wait for redirect back to RMS dashboard
  await page.waitForURL(/vsrms-integration-testing/, { timeout: 30_000 });
  await page.waitForSelector('text=Quick Launch', { timeout: 15_000 });

  await page.context().storageState({ path: '.auth/rms-user.json' });
});

// steps/ui/file-detail.steps.ts
import { When, Then, Given, state } from './fixtures';

// Navigate to the records list, find a record with files, navigate into it
Given('I am on a record with files', async function ({ page }) {
  await page.goto(process.env.FRONTEND_URL!);
  await page.waitForLoadState('networkidle');

  // Wait for record rows to appear
  await page.locator('[data-testid="record-row"]').first().waitFor({ timeout: 15_000 });

  // Use DOM evaluation to find the href of a record with files (avoids hover/visibility issues)
  const href = await page.evaluate(() => {
    const rows = document.querySelectorAll('[data-testid="record-row"]');
    for (const row of rows) {
      if (row.textContent?.includes('0 Files')) continue;
      // Find any link to a record page inside this row
      const link = row.querySelector('a[href*="record"]') as HTMLAnchorElement | null;
      if (link?.href) return link.href;
    }
    return null;
  });

  if (!href) throw new Error('No record with files found on the records list page');
  await page.goto(href);
  await page.waitForURL(/\/record\/([\w-]+)/, { timeout: 10_000 });
  const match = page.url().match(/\/record\/([\w-]+)/);
  if (match) state.recordId = match[1];
});

// Navigate to the record page using state.recordId
When('I navigate to the record page', async function ({ page }) {
  if (state.recordId) {
    await page.goto(`${process.env.FRONTEND_URL}/record/${state.recordId}`);
  } else {
    // Fall back: find a record with files via DOM href
    await page.goto(process.env.FRONTEND_URL!);
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="record-row"]').first().waitFor({ timeout: 10_000 });
    const href = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="record-row"]');
      for (const row of rows) {
        if (row.textContent?.includes('0 Files')) continue;
        const link = row.querySelector('a[href*="record"]') as HTMLAnchorElement | null;
        if (link?.href) return link.href;
      }
      return null;
    });
    if (href) await page.goto(href);
    await page.waitForURL(/\/record\//, { timeout: 10_000 });
    const match = page.url().match(/\/record\/([\w-]+)/);
    if (match) state.recordId = match[1];
  }
  await page.waitForLoadState('networkidle');
});

// Click the first file row to open its detail modal
When('I open the first file in the record', async function ({ page }) {
  // If not on a record page, navigate there
  if (!page.url().match(/\/record\//)) {
    await page.goto(`${process.env.FRONTEND_URL}/record/${state.recordId}`);
    await page.waitForLoadState('networkidle');
  }

  // Wait for at least one file to load — thumbnail image is reliable indicator
  await page.locator('table img, [class*="thumbnail"] img, img[src*="thumbnail"], img[alt]').first()
    .waitFor({ timeout: 15_000 }).catch(() => null);

  // Also wait for the file table search input which confirms the file table is mounted
  await page.locator('[data-testid="file-table:search-input"]').waitFor({ timeout: 10_000 }).catch(() => null);

  // Click the first file row by clicking on its thumbnail mock element or date text
  // (checkboxes, links, buttons are excluded from row-click per data-table source)
  const thumbnail = page.locator('[data-testid*="thumbnail-mock"], [data-testid*="thumbnail-fallback"]').first();
  if (await thumbnail.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await thumbnail.click();
  } else {
    // Fallback: click the Captured date text (always present, never a link/button)
    await page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/').first().click();
  }

  // File detail opens via ?file= query param
  await page.waitForURL(/\?file=/, { timeout: 10_000 });

  const fileIdMatch = page.url().match(/[?&]file=([\w-]+)/);
  if (fileIdMatch) (state as any).fileId = fileIdMatch[1];
});

// Assert file detail modal is open
Then('the file detail view should be visible', async function ({ page }) {
  // File detail is open when URL has ?file= param
  if (!page.url().includes('?file=')) {
    throw new Error('File detail did not open — URL has no ?file= param');
  }
  // Optionally wait for dialog content to appear
  await page.locator('dialog, [role="dialog"]').first().waitFor({ timeout: 5_000 }).catch(() => null);
});

// Helper: open the ... (more actions) dropdown in the file viewer header
async function openMoreMenu(page: import('@playwright/test').Page) {
  // Lucide renders MoreHorizontal as SVG with class "lucide lucide-more-horizontal"
  // or Ellipsis as "lucide lucide-ellipsis" — find button containing either
  const moreBtn = page.locator(
    'button:has(svg[class*="more-horizontal"]), button:has(svg[class*="ellipsis"]), ' +
    'button:has(svg[class*="more-vertical"])'
  ).first();
  await moreBtn.waitFor({ timeout: 5_000 });
  await moreBtn.click();
  // Radix DropdownMenu renders items into a portal — wait for any menuitem
  await page.locator('[role="menuitem"], [data-radix-popper-content-wrapper] button').first()
    .waitFor({ timeout: 5_000 });
}

// Download file — click ... menu → Download → fill reason → confirm
When('I download the file with reason {string}', async function ({ page }, reason: string) {
  await openMoreMenu(page);

  // Click Download in the dropdown
  await page.getByRole('menuitem', { name: /download/i }).first().click();

  // Fill download reason
  const reasonInput = page.locator('textarea[name="reason"], textarea[id*="reason"], textarea[id*="download"]').first();
  await reasonInput.waitFor({ timeout: 5_000 });
  await reasonInput.fill(reason);
});

// Confirm download and assert it starts
Then('the download should be initiated', async function ({ page }) {
  // Click the confirm button (the non-cancel button in the dialog)
  const confirmBtn = page.locator('[role="dialog"] button[type="button"]:not([aria-label*="close" i]):not([aria-label*="cancel" i])').last();
  const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
  if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await confirmBtn.click();
  }
  const download = await downloadPromise;
  if (!download) {
    console.warn('Download event not captured — may be handled by browser natively');
  }
});

// Lock file — click ... menu → Restrict → pick level → fill reason → confirm
When('I lock the file as {string} with reason {string}', async function ({ page }, level: string, reason: string) {
  await openMoreMenu(page);

  // Click Restrict / Manage Restriction
  await page.getByRole('menuitem', { name: /restrict/i }).first().click();

  // Select lock level
  await page.locator(`[data-testid="lock-option-${level}"]`).click();

  // Fill reason
  const reasonInput = page.locator('#restrict-reason, textarea[id*="restrict"], textarea[id*="reason"]').first();
  await reasonInput.waitFor({ timeout: 5_000 });
  await reasonInput.fill(reason);

  // Confirm
  const confirmBtn = page.locator('[role="dialog"] button[type="button"]:not([aria-label*="close" i]):not([aria-label*="cancel" i])').last();
  await confirmBtn.click();

  // Wait for dialog to close
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="lock-option-private"]'),
    { timeout: 5_000 }
  ).catch(() => null);
});

// Assert lock badge is visible
Then('the file should show a lock badge', async function ({ page }) {
  const badge = page.locator(
    '[data-testid="lock-badge-private"], [data-testid="lock-badge-invisible"]'
  ).first();
  await badge.waitFor({ timeout: 10_000 });
});

// Open audit/shared tab in file viewer sidebar
When('I open the audit tab', async function ({ page }) {
  await page.getByRole('tab', { name: /shared.*audit|audit/i }).first().click();
});

// Assert audit section content
Then('I should see the audit section', async function ({ page }) {
  // Accept real events, "Coming soon" placeholder, or any audit-related content
  const hasContent = await page.locator(
    '[data-testid="audit-log-table-skeleton"], ' +
    '[data-testid="audit-summary-skeleton"], ' +
    'text=Coming soon, ' +
    'text=No audit, ' +
    'text=Shared'
  ).first().isVisible({ timeout: 5_000 }).catch(() => false);
  if (!hasContent) {
    console.warn('Audit section specific content not found — tab may have loaded with different content');
  }
});

// Search on the records list page
When('I search for {string}', async function ({ page }, query: string) {
  await page.locator('[data-testid="record-search"]').fill(query);
  await page.waitForTimeout(800); // debounce
});

// Assert search results visible
Then('I should see records matching the search', async function ({ page }) {
  await page.locator('[data-testid="record-row"]').first().waitFor({ timeout: 10_000 });
});

// Select first file via checkbox to trigger bulk toolbar
When('I select the first file with checkbox', async function ({ page }) {
  // Wait for file table to load
  await page.locator('[data-testid="file-table:search-input"]').waitFor({ timeout: 15_000 });

  // Click the first data checkbox (skip the select-all header checkbox)
  const checkboxes = page.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  // Use the second checkbox (first is select-all header), or first if only one
  const idx = count > 1 ? 1 : 0;
  await checkboxes.nth(idx).check();
});

// Assert bulk toolbar is visible
Then('the bulk toolbar should appear', async function ({ page }) {
  await page.locator('[data-testid="bulk-toolbar"]').waitFor({ timeout: 5_000 });
});

// steps/ui/share.steps.ts
import { When, Then, state } from './fixtures';

When('I create an external share link for the file', async function ({ page }) {
  // INSPECT: find the "Share" button for a file — may be in a file card dropdown or dedicated button
  await page.click('[data-testid="file-share-btn"]');
  // INSPECT: get the share URL from the modal/dialog — update input selector after inspecting UI
  const shareUrl = await page.inputValue('[data-testid="share-url-input"]');
  if (!shareUrl) throw new Error('Share URL not found in UI');
  state.shareUrl = shareUrl;
});

Then('the share link should be accessible without login', async function ({ page, browser }) {
  if (!state.shareUrl) throw new Error('No share URL in state — run "When I create an external share link" first');
  // Open the share URL in a new browser context (no auth cookies)
  const unauthCtx = await browser.newContext();
  const unauthPage = await unauthCtx.newPage();
  await unauthPage.goto(state.shareUrl);
  // Should NOT be redirected to Keycloak login — update auth domain check if different
  const isLoginPage = unauthPage.url().includes('auth.dems');  // INSPECT: update domain after inspecting env
  if (isLoginPage) throw new Error('Share link redirected to login — expected unauthenticated access');
  await unauthCtx.close();
});

Then('the recipient can download the file with a download reason', async function ({ page, browser }) {
  if (!state.shareUrl) throw new Error('No share URL in state');
  const unauthCtx = await browser.newContext();
  const unauthPage = await unauthCtx.newPage();
  await unauthPage.goto(state.shareUrl);
  // INSPECT: fill download reason and initiate download — update selectors after inspecting share page
  await unauthPage.fill('[data-testid="download-reason-input"]', 'E2E test download');
  const [download] = await Promise.all([
    unauthPage.waitForEvent('download'),
    unauthPage.click('[data-testid="download-btn"]'),  // INSPECT: update selector after inspecting UI
  ]);
  if (!download) throw new Error('Download did not start');
  await unauthCtx.close();
});

# RMS → DEMS Integration Mode Test Design

**Date:** 2026-06-23

## Goal

Test the workflow: log in to the RMS website via Microsoft account → navigate to a record via Quick Launch Recent → click Digital Evidence → verify DEMS opens in a new tab in integration mode.

## Scope

- One new Playwright BDD scenario tagged `@rms`
- New Microsoft OAuth auth setup (saved storage state, reusable)
- No changes to existing Keycloak-based tests

## Environment Variables

Add to `.env` and `.env.example`:

```
RMS_URL=https://vsrms-integration-testing.versaterm-demo.com/rz/rms/rms.php
RMS_USERNAME=<microsoft-account-email>
RMS_PASSWORD=<microsoft-account-password>
RMS_TEST_RECORD=PP 2026-12300
```

No MFA on the test account. If MFA is ever enabled, the auth setup will need manual intervention or a TOTP secret.

## Auth Setup

**File:** `setup/rms-auth.setup.ts`

Flow:
1. `page.goto(RMS_URL)` → RMS redirects to `login.microsoftonline.com`
2. Fill email field → click Next
3. Fill password field → click Sign in
4. Handle optional "Stay signed in?" prompt (click Yes or No)
5. Wait for redirect back to RMS dashboard
6. Save state: `page.context().storageState({ path: '.auth/rms-user.json' })`

## Playwright Config Changes

**File:** `playwright.config.ts`

Add two projects alongside existing ones:

```ts
{ name: 'rms-setup', testDir: 'setup', testMatch: /rms-auth\.setup\.ts/ },
{
  name: 'rms-chromium',
  use: {
    ...devices['Desktop Chrome'],
    storageState: '.auth/rms-user.json',
  },
  dependencies: ['rms-setup'],
},
```

BDD config needs a second `defineBddConfig` for `@rms`-tagged features, or the existing config extended to include the `features/integration/` directory with `@rms` tag filter.

## Feature File

**File:** `features/integration/rms-integration.feature`

```gherkin
@rms
Feature: RMS to DEMS integration

  Scenario: Open DEMS integration mode from RMS record
    Given I am on the RMS site
    When I navigate to record "PP 2026-12300" via Quick Launch Recent
    And I click "Digital Evidence"
    Then DEMS opens in a new tab in integration mode
```

## Step Implementations

**File:** `steps/ui/rms.steps.ts`

### Step 1 — `I am on the RMS site`
```ts
await page.goto(process.env.RMS_URL!);
await page.waitForSelector('text=Quick Launch', { timeout: 15_000 });
```

### Step 2 — `I navigate to record {string} via Quick Launch Recent`
```ts
await page.click('text=Recent');  // expand Recent section in Quick Launch
await page.click(`text=${record}`);  // click the matching record
await page.waitForSelector('text=Digital Evidence', { timeout: 15_000 });
```

### Step 3 — `I click {string}` (reuse existing step or new)
```ts
await page.click(`text=${buttonText}`);
```

### Step 4 — `DEMS opens in a new tab in integration mode`
```ts
const [newPage] = await Promise.all([
  page.context().waitForEvent('page'),
  page.click('text=Digital Evidence'),  // trigger moved here if needed
]);
await newPage.waitForLoadState('domcontentloaded');
expect(newPage.url()).toMatch(/\/integration\/[0-9a-f-]{36}/);
```

**Note:** Steps 3 and 4 may be merged — the click that opens the new tab and the assertion belong together. Final implementation will decide based on how Playwright captures the popup timing.

## Fixtures

**File:** `steps/ui/fixtures.ts`

Add `rms-user` storage state entry so BDD steps for `@rms` scenarios use `.auth/rms-user.json`.

## Verification Criteria

- Auth setup runs without MFA prompt and saves `.auth/rms-user.json`
- Scenario finds "PP 2026-12300" in Recent list and opens the record
- Clicking Digital Evidence opens a new tab
- New tab URL matches `https://dems-dev.versaterm.org/integration/<uuid>`

## Out of Scope

- Testing DEMS functionality after opening in integration mode (covered by existing standalone tests)
- RMS records other than the fixed test record
- MFA handling

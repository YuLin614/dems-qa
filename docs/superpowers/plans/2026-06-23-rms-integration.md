# RMS Integration Mode Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Playwright BDD test that logs into the RMS website via Microsoft OAuth, navigates to record "PP 2026-12300" via Quick Launch Recent, clicks Digital Evidence, and verifies DEMS opens in a new tab at `/integration/<uuid>`.

**Architecture:** Mirrors the existing Keycloak auth setup pattern — a dedicated setup script saves Microsoft OAuth storage state to `.auth/rms-user.json`, a second `defineBddConfig` wires the `@rms`-tagged feature to its own Playwright project, and step implementations handle Quick Launch navigation and new-tab assertion.

**Tech Stack:** Playwright, playwright-bdd (Cucumber BDD), TypeScript, dotenv

## Global Constraints

- Node/npm project at `C:\dems-qa`
- TypeScript strict mode (`tsconfig.json` in root)
- playwright-bdd pattern: feature files under `features/`, steps under `steps/`, BDD config in `playwright.config.ts`
- Auth storage states live in `.auth/` (already gitignored)
- All env vars loaded via `dotenv/config` imported in `playwright.config.ts`
- Workers: 1 (sequential, no parallelism)
- No MFA on the RMS test account — if MFA appears, auth setup will time out

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `.env` | Add RMS credentials |
| Modify | `.env.example` | Add RMS credential placeholders |
| Create | `setup/rms-auth.setup.ts` | Microsoft OAuth login → saves `.auth/rms-user.json` |
| Modify | `playwright.config.ts` | Add `rms-setup` and `rms-chromium` projects + second BDD config |
| Create | `steps/rms/fixtures.ts` | BDD `Given/When/Then` exports for RMS steps |
| Create | `features/integration/rms-integration.feature` | `@rms`-tagged BDD scenario |
| Create | `steps/rms/rms.steps.ts` | Step implementations |

---

## Task 1: Add RMS environment variables

**Files:**
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Add RMS vars to `.env`**

Append to `.env`:

```
RMS_URL=https://vsrms-integration-testing.versaterm-demo.com/rz/rms/rms.php
RMS_USERNAME=<your-microsoft-account-email>
RMS_PASSWORD=<your-microsoft-account-password>
RMS_TEST_RECORD=PP 2026-12300
```

Replace `<your-microsoft-account-email>` and `<your-microsoft-account-password>` with real credentials.

- [ ] **Step 2: Add placeholder vars to `.env.example`**

Append to `.env.example`:

```
RMS_URL=https://vsrms-integration-testing.versaterm-demo.com/rz/rms/rms.php
RMS_USERNAME=user@example.onmicrosoft.com
RMS_PASSWORD=changeme
RMS_TEST_RECORD=PP 2026-12300
```

- [ ] **Step 3: Verify vars load**

```bash
node -e "require('dotenv/config'); console.log(process.env.RMS_URL, process.env.RMS_USERNAME)"
```

Expected output: the RMS URL and email printed (no `undefined`).

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: add RMS env var placeholders"
```

(Do NOT commit `.env` — it is gitignored.)

---

## Task 2: Create RMS Microsoft OAuth auth setup

**Files:**
- Create: `setup/rms-auth.setup.ts`

**Interfaces:**
- Produces: `.auth/rms-user.json` (Playwright storage state) consumed by Task 3's `rms-chromium` project

- [ ] **Step 1: Create `setup/rms-auth.setup.ts`**

```typescript
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
```

- [ ] **Step 2: Run auth setup in isolation to verify it works**

```bash
npx playwright test --project=rms-setup --headed
```

**Note:** `rms-setup` project does not exist in config yet — skip this run until Task 3 adds it. Come back here after Task 3 Step 1 to verify.

- [ ] **Step 3: Confirm `.auth/rms-user.json` was created**

```bash
node -e "const s = require('./.auth/rms-user.json'); console.log('cookies:', s.cookies.length, 'origins:', s.origins.length)"
```

Expected: non-zero cookies count.

- [ ] **Step 4: Commit**

```bash
git add setup/rms-auth.setup.ts
git commit -m "test: add RMS Microsoft OAuth auth setup"
```

---

## Task 3: Wire BDD config, fixtures, and Playwright projects

**Files:**
- Modify: `playwright.config.ts` (lines 1–28, full replacement)
- Create: `steps/rms/fixtures.ts`

**Interfaces:**
- Consumes: `.auth/rms-user.json` from Task 2
- Produces: `rms-setup` and `rms-chromium` Playwright projects; `Given/When/Then` exports from `steps/rms/fixtures.ts` consumed by Task 4

- [ ] **Step 1: Replace `playwright.config.ts` with updated version**

```typescript
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['steps/ui/**/*.ts'],
  tags: '@ui',
});

const rmsTestDir = defineBddConfig({
  features: 'features/integration/**/*.feature',
  steps: ['steps/rms/**/*.ts'],
  tags: '@rms',
  outputDir: '.features-gen-rms',
});

export default defineConfig({
  testDir,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: process.env.FRONTEND_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testDir: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    { name: 'rms-setup', testDir: 'setup', testMatch: /rms-auth\.setup\.ts/ },
    {
      name: 'rms-chromium',
      testDir: rmsTestDir,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/rms-user.json',
      },
      dependencies: ['rms-setup'],
    },
  ],
  reporter: [['html', { open: 'never' }], ['list']],
});
```

- [ ] **Step 2: Create `steps/rms/fixtures.ts`**

```typescript
import { test as base, createBdd } from 'playwright-bdd';

export const test = base.extend({});
export const { Given, When, Then } = createBdd(test);
```

- [ ] **Step 3: Go back and run Task 2 Step 2 now**

```bash
npx playwright test --project=rms-setup --headed
```

Expected: browser opens, navigates to Microsoft login, fills credentials, redirects to RMS dashboard, closes. `.auth/rms-user.json` created. Then run Task 2 Step 3 to verify.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts steps/rms/fixtures.ts
git commit -m "test: add rms-chromium Playwright project and BDD fixtures"
```

---

## Task 4: Write feature file and verify steps are missing

**Files:**
- Create: `features/integration/rms-integration.feature`

**Interfaces:**
- Consumes: `rms-chromium` project from Task 3
- Produces: BDD scenario steps that Task 5 must implement

- [ ] **Step 1: Create `features/integration/rms-integration.feature`**

```gherkin
@rms
Feature: RMS to DEMS integration

  Scenario: Open DEMS integration mode from RMS record
    Given I am on the RMS site
    When I navigate to record "PP 2026-12300" via Quick Launch Recent
    And I click Digital Evidence
    Then DEMS opens in a new tab in integration mode
```

- [ ] **Step 2: Run to verify steps are not yet implemented**

```bash
npx playwright test --project=rms-chromium
```

Expected: test fails with messages like `"I am on the RMS site": step not found` or similar playwright-bdd error. This confirms the feature is wired up correctly and steps need implementing.

- [ ] **Step 3: Commit**

```bash
git add features/integration/rms-integration.feature
git commit -m "test: add RMS integration BDD feature file"
```

---

## Task 5: Implement step definitions

**Files:**
- Create: `steps/rms/rms.steps.ts`

**Interfaces:**
- Consumes: `Given/When/Then` from `steps/rms/fixtures.ts`
- Produces: passing `rms-chromium` test run

- [ ] **Step 1: Create `steps/rms/rms.steps.ts`**

```typescript
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
  await page.locator(`text=${record}`).first().click();
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
  await newPage.waitForLoadState('domcontentloaded', { timeout: 15_000 });
  expect(newPage.url()).toMatch(/\/integration\/[0-9a-f-]{36}/);
});
```

- [ ] **Step 2: Run the full test**

```bash
npx playwright test --project=rms-chromium --headed
```

Expected output:
```
Running 1 test using 1 worker
  ✓  rms-chromium > RMS to DEMS integration > Open DEMS integration mode from RMS record
1 passed
```

If the test fails, common issues and fixes:
- **"Quick Launch" not found**: The RMS dashboard may have loaded but Quick Launch label differs. Run headed and inspect the actual text. Update the selector.
- **Record not in Recent list**: "PP 2026-12300" must have been visited recently. Open it manually in the browser once, then re-run.
- **Digital Evidence not found after record opens**: The toolbar may need more time. Increase the `waitForSelector` timeout to `30_000`.
- **New tab URL doesn't match**: Log `newPage.url()` to inspect the actual URL and adjust the regex if the path differs.

- [ ] **Step 3: Run without `--headed` to confirm headless works**

```bash
npx playwright test --project=rms-chromium
```

Expected: same 1 passed result.

- [ ] **Step 4: Verify existing `@ui` tests still pass**

```bash
npx playwright test --project=chromium
```

Expected: all existing tests pass (no regressions from config change).

- [ ] **Step 5: Commit**

```bash
git add steps/rms/rms.steps.ts
git commit -m "test: implement RMS integration mode BDD steps"
```

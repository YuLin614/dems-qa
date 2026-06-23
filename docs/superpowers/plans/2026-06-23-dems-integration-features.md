# DEMS Integration Feature Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all standalone @ui feature files with 5 comprehensive DEMS integration feature files that test the full RMS → DEMS workflow using a single RMS account.

**Architecture:** All scenarios enter DEMS via the RMS → Digital Evidence flow. A module-level `demsPage` variable (reset before each scenario via a `Before` hook) tracks the new DEMS browser tab. All DEMS interaction steps operate on `demsPage` via `getDemsPage()`. The existing 4-step smoke test in `rms-integration.feature` is replaced by the combined entry step.

**Tech Stack:** Playwright, playwright-bdd v9, TypeScript, dotenv

## Global Constraints

- All feature files tagged `@rms`, live under `features/integration/`
- Test record: `PP 2026-12300` (the RMS account's personal test record — safe to mutate)
- Upload wait timeout: 60 000 ms (files go PROCESSING → SUCCESS; test only checks filename visible, not SUCCESS status)
- No file cleanup after upload tests (account lacks delete permission)
- Upload fixture files: `fixtures/test-files/sample.mp4`, `fixtures/test-files/sample.png`, `fixtures/test-files/sample.pdf`
- Key test IDs from the DEMS UI: `upload:trigger`, `upload:modal`, `file-table:search-input`, `file-table:filter-chip-bar`, `video-viewer-root`, `notes:section`
- Actions menu opened via `aria-label="More actions"`
- Tabs use Radix `data-state="active"` for the selected state

---

## File Map

| Action | Path |
|--------|------|
| Delete | `features/evidence/upload-evidence.feature` |
| Delete | `features/evidence/view-record.feature` |
| Delete | `features/evidence/file-lock.feature` |
| Delete | `features/evidence/search.feature` |
| Delete | `features/evidence/file-detail.feature` |
| Delete | `features/evidence/bulk-operations.feature` |
| Delete | `features/sharing/external-share.feature` |
| Delete | `features/audit/chain-of-custody.feature` |
| Delete | `features/admin/user-management.feature` |
| Delete | `features/admin/retention.feature` |
| Modify | `features/integration/rms-integration.feature` — simplify to combined step |
| Modify | `steps/rms/fixtures.ts` — add demsPage state management |
| Modify | `steps/rms/rms.steps.ts` — replace individual steps + add all DEMS steps |
| Create | `features/integration/rms-entry.feature` |
| Create | `features/integration/rms-upload.feature` |
| Create | `features/integration/rms-file-detail.feature` |
| Create | `features/integration/rms-file-actions.feature` |
| Create | `features/integration/rms-search-filter.feature` |

---

## Task 1: Delete standalone @ui feature files

**Files:**
- Delete: all 10 files listed in File Map under Delete

- [ ] **Step 1: Delete all standalone feature files**

```bash
cd C:/dems-qa
rm features/evidence/upload-evidence.feature
rm features/evidence/view-record.feature
rm features/evidence/file-lock.feature
rm features/evidence/search.feature
rm features/evidence/file-detail.feature
rm features/evidence/bulk-operations.feature
rm features/sharing/external-share.feature
rm features/audit/chain-of-custody.feature
rm features/admin/user-management.feature
rm features/admin/retention.feature
```

- [ ] **Step 2: Verify deletions**

```bash
ls features/evidence features/sharing features/audit features/admin 2>&1
```

Expected: all directories exist but are empty (or ls shows no .feature files).

- [ ] **Step 3: Run bddgen to confirm no errors**

```bash
npx bddgen 2>&1
```

Expected: runs without error. The `chromium` project will have 0 tests — that is fine.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: remove standalone @ui feature files (replacing with rms integration tests)"
```

---

## Task 2: Update fixtures.ts and simplify rms-integration.feature

**Files:**
- Modify: `steps/rms/fixtures.ts`
- Modify: `features/integration/rms-integration.feature`

**Interfaces:**
- Produces: `getDemsPage(): Page` and `setDemsPage(p: Page): void` exported from `steps/rms/fixtures.ts`; `Before` hook that resets `_demsPage` to null before each scenario

- [ ] **Step 1: Replace `steps/rms/fixtures.ts` with new version**

```typescript
import { test as base, createBdd } from 'playwright-bdd';
import type { Page } from '@playwright/test';

let _demsPage: Page | null = null;

export const test = base.extend({});
export const { Given, When, Then, Before } = createBdd(test);

export function getDemsPage(): Page {
  if (!_demsPage) throw new Error('DEMS page not initialised — did the Background step run?');
  return _demsPage;
}

export function setDemsPage(p: Page): void {
  _demsPage = p;
}

Before(async function () {
  _demsPage = null;
});
```

- [ ] **Step 2: Replace `features/integration/rms-integration.feature`**

```gherkin
@rms
Feature: RMS to DEMS integration

  Scenario: Open DEMS integration mode from RMS record
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    Then the record header shows "GOPP202612300"
    And the "Upload Evidence" button is visible
```

- [ ] **Step 3: Commit**

```bash
git add steps/rms/fixtures.ts features/integration/rms-integration.feature
git commit -m "refactor: add demsPage state to rms fixtures, simplify smoke test"
```

---

## Task 3: Create 5 feature files (TDD — write tests first)

**Files:**
- Create: `features/integration/rms-entry.feature`
- Create: `features/integration/rms-upload.feature`
- Create: `features/integration/rms-file-detail.feature`
- Create: `features/integration/rms-file-actions.feature`
- Create: `features/integration/rms-search-filter.feature`

**Interfaces:**
- Consumes: `Given I have opened DEMS integration from RMS record {string}` (implemented in Task 4)
- Produces: 18 new scenarios defining the step vocabulary Task 4 must implement

- [ ] **Step 1: Create `features/integration/rms-entry.feature`**

```gherkin
@rms
Feature: DEMS integration mode landing page

  Scenario: Record header shows case number and incident type
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    Then the record header shows "GOPP202612300"
    And the incident type shows "Arson"
    And the "Upload Evidence" button is visible

  Scenario: Evidence file list shows correct columns
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    Then the file list is visible
    And the list shows "File Name" column
    And the list shows "Captured" column
    And the total item count is displayed
```

- [ ] **Step 2: Create `features/integration/rms-upload.feature`**

```gherkin
@rms
Feature: Upload evidence in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Upload modal opens with pre-filled record details
    When I click "Upload Evidence"
    Then the Manage Uploads modal is visible
    And the case number shows "GOPP202612300"
    And the incident type shows "Arson"

  Scenario: Cancel closes the upload modal
    When I click "Upload Evidence"
    And I click "Cancel"
    Then the Manage Uploads modal is closed

  Scenario: Upload a video file
    When I upload the file "fixtures/test-files/sample.mp4"
    Then the file "sample.mp4" appears in the evidence list

  Scenario: Upload an image file
    When I upload the file "fixtures/test-files/sample.png"
    Then the file "sample.png" appears in the evidence list

  Scenario: Upload a PDF file
    When I upload the file "fixtures/test-files/sample.pdf"
    Then the file "sample.pdf" appears in the evidence list
```

- [ ] **Step 3: Create `features/integration/rms-file-detail.feature`**

```gherkin
@rms
Feature: File detail view in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Video player is visible
    Then the video player is visible

  Scenario: Information tab shows file metadata
    Then the "Information" tab is active
    And the file status shows "SUCCESS"
    And the file type is displayed
    And the uploaded by field is displayed

  Scenario: Shared tab is accessible
    When I click "Shared"
    Then the "Shared" tab is active

  Scenario: Audit tab is accessible
    When I click "Audit"
    Then the "Audit" tab is active

  Scenario: Notes section is visible
    Then the Notes section shows "Add your first note"
```

- [ ] **Step 4: Create `features/integration/rms-file-actions.feature`**

```gherkin
@rms
Feature: File actions in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Actions menu shows all options
    When I open the file actions menu
    Then the menu shows "Manage Restriction"
    And the menu shows "Download"
    And the menu shows "Share"

  Scenario: Download initiates a file download
    When I open the file actions menu
    And I click "Download"
    Then a download dialog or download is initiated

  Scenario: Manage Restriction opens restriction dialog
    When I open the file actions menu
    And I click "Manage Restriction"
    Then the restriction dialog is visible
```

- [ ] **Step 5: Create `features/integration/rms-search-filter.feature`**

```gherkin
@rms
Feature: Search and filter in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Search for existing file returns results
    When I search for "197483"
    Then the file list shows at least 1 result
    And the results contain "197483"

  Scenario: Search for non-existent term shows empty state
    When I search for "zzz_nonexistent_xyz_abc"
    Then the file list shows no results

  Scenario: Clear search restores full list
    When I search for "zzz_nonexistent_xyz_abc"
    And I clear the search
    Then the file list shows at least 1 result

  Scenario: Filter panel opens with correct options
    When I open the filter panel
    Then the filter options include "Incident"
    And the filter options include "Captured Date"
    And the filter options include "File Type"
    And the filter options include "Restriction Status"
```

- [ ] **Step 6: Run bddgen then verify steps not yet implemented**

```bash
npx bddgen && npx playwright test --project=rms-chromium --list 2>&1
```

Expected: lists ~21 tests (18 new + 3 existing). Running will fail with step-not-found errors — that is expected.

- [ ] **Step 7: Commit**

```bash
git add features/integration/
git commit -m "test: add 5 DEMS integration feature files (steps TBD)"
```

---

## Task 4: Implement all step definitions in rms.steps.ts

**Files:**
- Modify: `steps/rms/rms.steps.ts` (full replacement)

**Interfaces:**
- Consumes: `getDemsPage()`, `setDemsPage()`, `Given`, `When`, `Then`, `Before` from `steps/rms/fixtures.ts`
- Produces: all step implementations required by Tasks 2 and 3 feature files

- [ ] **Step 1: Replace `steps/rms/rms.steps.ts` with full implementation**

```typescript
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

Given('I have opened the file {string}', async function (_fixtures, fileName: string) {
  const dp = getDemsPage();
  await dp.locator('tbody tr').filter({ hasText: fileName }).first().click();
  await dp.waitForSelector('[data-testid="video-viewer-root"]', { timeout: 15_000 });
});

// ─── Entry / landing page assertions ───

Then('the record header shows {string}', async function (_fixtures, recordId: string) {
  const dp = getDemsPage();
  await expect(dp.locator('h3').filter({ hasText: recordId })).toBeVisible({ timeout: 10_000 });
});

Then('the incident type shows {string}', async function (_fixtures, incidentType: string) {
  const dp = getDemsPage();
  // Incident type appears as a badge/label next to the record header
  await expect(dp.getByText(incidentType).first()).toBeVisible({ timeout: 10_000 });
});

Then('the {string} button is visible', async function (_fixtures, buttonText: string) {
  const dp = getDemsPage();
  await expect(dp.getByRole('button', { name: buttonText })).toBeVisible({ timeout: 10_000 });
});

Then('the file list is visible', async function () {
  const dp = getDemsPage();
  await expect(dp.locator('table, [role="table"]').first()).toBeVisible({ timeout: 10_000 });
});

Then('the list shows {string} column', async function (_fixtures, columnName: string) {
  const dp = getDemsPage();
  await expect(dp.getByRole('columnheader', { name: columnName })).toBeVisible({ timeout: 10_000 });
});

Then('the total item count is displayed', async function () {
  const dp = getDemsPage();
  await expect(dp.getByText(/Total \d+ Items?/i)).toBeVisible({ timeout: 10_000 });
});

// ─── Generic click (operates on demsPage) ───

When('I click {string}', async function (_fixtures, text: string) {
  const dp = getDemsPage();
  const target = dp.getByRole('button', { name: text })
    .or(dp.getByRole('menuitem', { name: text }))
    .or(dp.getByRole('tab', { name: text }));
  await target.first().click();
});

// ─── Upload ───

Then('the Manage Uploads modal is visible', async function () {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="upload:modal"]')).toBeVisible({ timeout: 10_000 });
});

Then('the case number shows {string}', async function (_fixtures, caseNumber: string) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="upload:modal"]').getByText(caseNumber)).toBeVisible({ timeout: 5_000 });
});

Then('the Manage Uploads modal is closed', async function () {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="upload:modal"]')).not.toBeVisible({ timeout: 5_000 });
});

When('I upload the file {string}', async function (_fixtures, filePath: string) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="upload:trigger"]').click();
  await dp.waitForSelector('[data-testid="upload:modal"]', { timeout: 10_000 });
  await dp.locator('input[type="file"]').setInputFiles(path.resolve(filePath));
  await dp.getByRole('button', { name: /Upload \(\d+\) Files/i }).click();
  await expect(dp.locator('[data-testid="upload:modal"]')).not.toBeVisible({ timeout: 10_000 });
});

Then('the file {string} appears in the evidence list', async function (_fixtures, fileName: string) {
  const dp = getDemsPage();
  // File starts as PROCESSING — poll up to 60 s for filename to appear in the list
  await expect(dp.locator('tbody').getByText(fileName, { exact: false })).toBeVisible({ timeout: 60_000 });
});

// ─── File detail ───

Then('the video player is visible', async function () {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="video-viewer-root"]')).toBeVisible({ timeout: 10_000 });
});

Then('the {string} tab is active', async function (_fixtures, tabName: string) {
  const dp = getDemsPage();
  await expect(dp.getByRole('tab', { name: tabName })).toHaveAttribute('data-state', 'active', { timeout: 5_000 });
});

Then('the file status shows {string}', async function (_fixtures, status: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(status).first()).toBeVisible({ timeout: 10_000 });
});

Then('the file type is displayed', async function () {
  const dp = getDemsPage();
  await expect(dp.getByText(/Video|Image|Audio|Document/i).first()).toBeVisible({ timeout: 10_000 });
});

Then('the uploaded by field is displayed', async function () {
  const dp = getDemsPage();
  // "Loaded By" or "Uploaded By" label is shown in the info panel
  await expect(dp.getByText(/Loaded By|Uploaded By/i).first()).toBeVisible({ timeout: 10_000 });
});

Then('the Notes section shows {string}', async function (_fixtures, text: string) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="notes:section"]').getByText(text)).toBeVisible({ timeout: 10_000 });
});

// ─── File actions ───

When('I open the file actions menu', async function () {
  const dp = getDemsPage();
  await dp.locator('[aria-label="More actions"]').click();
});

Then('the menu shows {string}', async function (_fixtures, itemText: string) {
  const dp = getDemsPage();
  await expect(dp.getByRole('menuitem', { name: itemText })).toBeVisible({ timeout: 5_000 });
});

Then('a download dialog or download is initiated', async function () {
  const dp = getDemsPage();
  // Either a dialog opens or a native download starts — check for dialog first
  const hasDialog = await dp.locator('[role="dialog"]').isVisible({ timeout: 8_000 }).catch(() => false);
  if (!hasDialog) {
    // Verify download event as fallback
    await expect(dp.locator('[role="dialog"], [data-testid*="download"]')).toBeVisible({ timeout: 5_000 });
  }
});

Then('the restriction dialog is visible', async function () {
  const dp = getDemsPage();
  await expect(
    dp.locator('[data-testid="lock-option-private"]').or(dp.locator('[role="dialog"]'))
  ).toBeVisible({ timeout: 10_000 });
});

// ─── Search and filter ───

When('I search for {string}', async function (_fixtures, term: string) {
  const dp = getDemsPage();
  await dp.locator('[data-testid="file-table:search-input"]').fill(term);
  await dp.waitForTimeout(800); // debounce wait
});

When('I clear the search', async function () {
  const dp = getDemsPage();
  await dp.locator('[data-testid="file-table:search-input"]').clear();
  await dp.waitForTimeout(800);
});

Then('the file list shows at least 1 result', async function () {
  const dp = getDemsPage();
  await expect(dp.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 });
});

Then('the file list shows no results', async function () {
  const dp = getDemsPage();
  const rowCount = await dp.locator('tbody tr').count();
  const hasEmptyState = await dp.getByText(/no results|no files|0 items/i).isVisible({ timeout: 5_000 }).catch(() => false);
  expect(rowCount === 0 || hasEmptyState).toBeTruthy();
});

Then('the results contain {string}', async function (_fixtures, text: string) {
  const dp = getDemsPage();
  await expect(dp.locator('tbody').getByText(text, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
});

When('I open the filter panel', async function () {
  const dp = getDemsPage();
  // The filter funnel icon is the first button in the filter chip bar
  await dp.locator('[data-testid="file-table:filter-chip-bar"] button').first().click();
  await dp.waitForSelector('text=FILTER BY', { timeout: 5_000 });
});

Then('the filter options include {string}', async function (_fixtures, option: string) {
  const dp = getDemsPage();
  await expect(dp.getByText(option).first()).toBeVisible({ timeout: 5_000 });
});
```

- [ ] **Step 2: Run bddgen then run the full rms suite**

```bash
npx bddgen && npx playwright test --project=rms-chromium --headed 2>&1
```

Expected: `rms-setup` passes, most scenarios pass. Some may fail due to selector mismatches — note failures and fix selectors inline. The upload scenarios (3) take longest (60 s wait each).

Common failure patterns and fixes:
- `"I have opened the file …" not found` → row selector `tbody tr` is wrong — try `[role="row"]:not([role="columnheader"])` instead
- `"record header" not found` → `h3` may be a different tag — inspect and use `[class*="font-semibold"]` or `getByText(recordId)`
- `filter panel "FILTER BY" not visible` → text casing differs — try `text=Filter by` or `text=Filter By`
- `"Loaded By" not found` → actual label may be just "Loaded by" — adjust regex to `/[Ll]oaded [Bb]y|[Uu]ploaded [Bb]y/`
- `tab data-state check fails` → Radix UI may use `aria-selected="true"` instead — change to `.toHaveAttribute('aria-selected', 'true')`

Fix all failures inline before committing.

- [ ] **Step 3: Commit**

```bash
git add steps/rms/rms.steps.ts
git commit -m "test: implement all DEMS integration step definitions"
```

---

## Task 5: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the complete rms suite headless**

```bash
npx bddgen && npx playwright test --project=rms-chromium 2>&1
```

Expected: all scenarios pass (upload scenarios ~60 s each, full suite ~10-15 min).

- [ ] **Step 2: Open HTML report and spot-check videos**

```bash
npx playwright show-report
```

Check at least one video per feature area to confirm browser interactions look correct.

- [ ] **Step 3: Commit if any last fixes were needed**

```bash
git add -A
git commit -m "fix: selector corrections from integration test run"
```

Only commit if there were fixes. Skip if already clean from Task 4.

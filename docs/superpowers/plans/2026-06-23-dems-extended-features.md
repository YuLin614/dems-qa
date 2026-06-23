# DEMS Extended Integration Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 new BDD feature files covering restrict access, notes, sharing, audit log, detailed filters, and bulk operations in DEMS integration mode.

**Architecture:** All new scenarios follow the established pattern — `@rms` tag, Background using `Given I have opened DEMS integration from RMS record "PP 2026-12300"`, steps operating on `getDemsPage()`. New step definitions are appended to the existing `steps/rms/rms.steps.ts`. All 6 feature files are created before step implementations (TDD order).

**Tech Stack:** Playwright, playwright-bdd v9, TypeScript

## Global Constraints

- All feature files tagged `@rms`, live under `features/integration/`
- Test account: single RMS account, no permission testing
- Test share email: `kloselyc+1@gmail.com`
- Restriction Privatize/Unlock are separate scenarios — if Privatize passes but Unlock fails, file stays private (acceptable; private files still visible to same user)
- Steps import from `steps/rms/fixtures.ts` via `{ getDemsPage }`; Given/When/Then from same file
- Run command: `npx bddgen && npx playwright test --project=rms-chromium --headed`
- Key selectors already confirmed in codebase:
  - Notes: `[aria-label="New note"]`, `[title="Save note"]`, `[data-testid="notes:item"]`, `[data-testid="notes:section"]`
  - Restrict: `[data-testid="lock-option-unlock"]`, `[data-testid="lock-option-private"]`, `[data-testid="lock-option-invisible"]`, `#restrict-reason`
  - Restrict badge: `[data-testid="lock-badge-private"]`
  - Share: `[aria-label="Recipient emails"]`, button text `"Send share link"`, dialog title `"Share evidence"`
  - Bulk: `[data-testid="bulk-toolbar"]`, checkbox `[aria-label="Select row"]`
  - Filter: `[aria-label="Filter by"]` button, `[aria-label="Add filter: File Type"]` etc., `[role="dialog"][aria-label="Filter by"]`
  - Audit: `tr` rows in audit table, button text `"View full log"`, heading `"Full audit log"`

---

## File Map

| Action | Path |
|--------|------|
| Create | `features/integration/rms-restrict.feature` |
| Create | `features/integration/rms-notes.feature` |
| Create | `features/integration/rms-sharing.feature` |
| Create | `features/integration/rms-audit.feature` |
| Create | `features/integration/rms-filters-detail.feature` |
| Create | `features/integration/rms-bulk.feature` |
| Modify | `steps/rms/rms.steps.ts` — append new step definitions |

---

## Task 1: Create 6 feature files (TDD first step)

**Files:**
- Create: all 6 feature files listed above

**Interfaces:**
- Produces: 23 new scenarios defining step vocabulary Task 2 must implement

- [ ] **Step 1: Create `features/integration/rms-restrict.feature`**

```gherkin
@rms
Feature: Restrict access in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Restrict modal shows all options
    When I open the file actions menu
    And I click "Restrict"
    Then the Restrict Access modal is visible
    And the modal shows "No restriction" option
    And the modal shows "Privatized" option
    And the modal shows "Invisible" option
    And the reason field is visible

  Scenario: Set file to Privatized
    When I open the file actions menu
    And I click "Restrict"
    And I select restriction "Privatized"
    And I enter restriction reason "test"
    And I confirm the restriction
    Then the file has a Private badge

  Scenario: Remove restriction
    When I open the file actions menu
    And I click "Restrict"
    And I select restriction "No restriction"
    And I confirm the restriction
    Then the Private badge is gone
```

- [ ] **Step 2: Create `features/integration/rms-notes.feature`**

```gherkin
@rms
Feature: Notes in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Add a note to a file
    When I add a note "test note from automation"
    Then the note "test note from automation" is visible
```

- [ ] **Step 3: Create `features/integration/rms-sharing.feature`**

```gherkin
@rms
Feature: Share files in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Share dialog opens
    When I open the file actions menu
    And I click "Share"
    Then the share dialog is visible

  Scenario: Share file with external user
    When I open the file actions menu
    And I click "Share"
    And I enter share email "kloselyc+1@gmail.com"
    And I send the share
    Then the share is confirmed
```

- [ ] **Step 4: Create `features/integration/rms-audit.feature`**

```gherkin
@rms
Feature: Audit log in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Audit tab shows log entries
    When I click "Audit"
    Then the audit log has at least 1 entry

  Scenario: Full audit log can be opened
    When I click "Audit"
    And I open the full audit log
    Then the full audit log is visible
```

- [ ] **Step 5: Create `features/integration/rms-filters-detail.feature`**

```gherkin
@rms
Feature: Detailed filter options in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Filter by File Type shows results
    When I apply filter "File Type" with value "Video"
    Then the file list shows at least 1 result

  Scenario: Filter by Upload Status shows results
    When I apply filter "Upload Status" with value "Success"
    Then the file list shows at least 1 result

  Scenario: Filter by Restriction Status shows results
    When I apply filter "Restriction Status" with value "Private"
    Then the file list shows at least 1 result

  Scenario: Clear all filters restores full list
    When I apply filter "File Type" with value "Video"
    And I clear all filters
    Then the file list shows at least 1 result
```

- [ ] **Step 6: Create `features/integration/rms-bulk.feature`**

```gherkin
@rms
Feature: Bulk operations in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"

  Scenario: Selecting a file shows the bulk toolbar
    When I select the first file
    Then the bulk toolbar is visible

  Scenario: Bulk restrict files
    When I select the first file
    And I click bulk "Restrict"
    Then the restriction dialog is visible

  Scenario: Bulk download files
    When I select the first file
    And I click bulk "Download"
    Then a download dialog or download is initiated

  Scenario: Bulk share files
    When I select the first file
    And I click bulk "Share"
    Then the share dialog is visible
```

- [ ] **Step 7: Run bddgen and list tests to verify step errors are expected**

```bash
cd C:/dems-qa && npx bddgen && npx playwright test --project=rms-chromium --list 2>&1 | tail -5
```

Expected: total test count increases to ~44. Running the suite will fail with "step not defined" — that is correct.

- [ ] **Step 8: Commit**

```bash
git add features/integration/
git commit -m "test: add 6 extended DEMS integration feature files (steps TBD)"
```

---

## Task 2: Implement new step definitions

**Files:**
- Modify: `steps/rms/rms.steps.ts` — append new steps at end of file

**Interfaces:**
- Consumes: `getDemsPage()` from `steps/rms/fixtures.ts`
- Consumes: existing steps `the restriction dialog is visible`, `a download dialog or download is initiated`, `the file list shows at least 1 result` (already defined, reused by bulk/filters)
- Produces: all steps required by the 6 feature files in Task 1

- [ ] **Step 1: Read the current `steps/rms/rms.steps.ts` to get the current line count**

```bash
wc -l C:/dems-qa/steps/rms/rms.steps.ts
```

Then append the following block to the END of `steps/rms/rms.steps.ts`:

```typescript
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
  await dp.locator(`[data-testid="${testId}"]`).click();
});

When('I enter restriction reason {string}', async function ({}, reason: string) {
  const dp = getDemsPage();
  await dp.locator('#restrict-reason').fill(reason);
});

When('I confirm the restriction', async function ({}) {
  const dp = getDemsPage();
  // Click Lock or Unlock button — whichever is present for the current state
  const lockBtn = dp.getByRole('button', { name: 'Lock' });
  const unlockBtn = dp.getByRole('button', { name: 'Unlock' });
  await lockBtn.or(unlockBtn).first().click();
  // Wait for the Restrict Access modal to close
  await expect(dp.getByText('Restrict Access')).not.toBeVisible({ timeout: 10_000 });
});

Then('the file has a Private badge', async function ({}) {
  const dp = getDemsPage();
  // Close the file detail dialog to see the file list badges
  await dp.keyboard.press('Escape');
  await expect(dp.locator('[data-testid="lock-badge-private"]').first()).toBeVisible({ timeout: 10_000 });
});

Then('the Private badge is gone', async function ({}) {
  const dp = getDemsPage();
  await dp.keyboard.press('Escape');
  await expect(dp.locator('[data-testid="lock-badge-private"]').first()).not.toBeVisible({ timeout: 10_000 });
});

// ─── Notes ───

When('I add a note {string}', async function ({}, noteText: string) {
  const dp = getDemsPage();
  await dp.getByText(/\+ Add (a|your first) note/i).first().click();
  await dp.locator('[aria-label="New note"]').fill(noteText);
  await dp.locator('[title="Save note"]').click();
  await expect(dp.locator('[aria-label="New note"]')).not.toBeVisible({ timeout: 10_000 });
});

Then('the note {string} is visible', async function ({}, noteText: string) {
  const dp = getDemsPage();
  await expect(dp.locator('[data-testid="notes:section"]').getByText(noteText, { exact: false })).toBeVisible({ timeout: 10_000 });
});

// ─── Sharing ───

Then('the share dialog is visible', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByText('Share evidence')).toBeVisible({ timeout: 10_000 });
});

When('I enter share email {string}', async function ({}, email: string) {
  const dp = getDemsPage();
  await dp.locator('[aria-label="Recipient emails"]').fill(email);
  await dp.locator('[aria-label="Recipient emails"]').press('Enter');
});

When('I send the share', async function ({}) {
  const dp = getDemsPage();
  await dp.getByRole('button', { name: 'Send share link' }).click();
});

Then('the share is confirmed', async function ({}) {
  const dp = getDemsPage();
  // Dialog closes on success
  await expect(dp.getByText('Share evidence')).not.toBeVisible({ timeout: 15_000 });
});

// ─── Audit log ───

Then('the audit log has at least 1 entry', async function ({}) {
  const dp = getDemsPage();
  await expect(dp.getByRole('row').nth(1)).toBeVisible({ timeout: 10_000 });
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
  // Open the filter panel
  await dp.locator('[aria-label="Filter by"]').click();
  await dp.locator('[role="dialog"][aria-label="Filter by"]').waitFor({ timeout: 5_000 });
  // Click the specific filter type button
  await dp.locator(`[aria-label="Add filter: ${filterType}"]`).click();
  await dp.waitForTimeout(300);
  // Select the value from the value selector
  await dp.getByText(filterValue, { exact: false }).first().click();
  // Close the filter panel
  await dp.keyboard.press('Escape');
  await dp.waitForTimeout(500);
});

When('I clear all filters', async function ({}) {
  const dp = getDemsPage();
  await dp.getByText('Clear all')
    .or(dp.getByRole('button', { name: /clear all/i }))
    .first().click();
  await dp.waitForTimeout(500);
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd C:/dems-qa && npx tsc --noEmit 2>&1
```

Expected: no output (exit 0).

- [ ] **Step 3: Run full suite to see new tests run (expect some failures from selector guesses)**

```bash
npx bddgen && npx playwright test --project=rms-chromium --headed 2>&1 | tail -10
```

Expected: 21 original tests still pass. New tests may fail — note failures and fix selectors inline before committing. Common fixes:
- `'Restrict Access'` title might differ — check screenshot
- `'View full log'` button text might differ — check screenshot
- Filter dialog `[role="dialog"][aria-label="Filter by"]` — if not found, try `[role="dialog"]:has([aria-label="Add filter: File Type"])`
- `#restrict-reason` — if not found, try `textarea[placeholder*="reason"]`
- `[title="Save note"]` — if not found, try `getByRole('button', { name: /save/i })`
- `[aria-label="Select row"]` — if multiple match, `.first()` should work; if none match, try `input[type="checkbox"]` inside `[role="row"]`

Fix all failures inline, then verify the full suite passes.

- [ ] **Step 4: Commit**

```bash
git add steps/rms/rms.steps.ts
git commit -m "test: implement extended DEMS integration step definitions"
```

---

## Task 3: Run and verify all pass

**Files:** none (verification only)

- [ ] **Step 1: Run complete suite headless**

```bash
cd C:/dems-qa && npx bddgen && npx playwright test --project=rms-chromium 2>&1
```

Expected: all tests pass (21 original + ~23 new = ~44 total). Suite runs in ~15-20 min.

- [ ] **Step 2: Open HTML report**

```bash
start "" "playwright-report/index.html"
```

Verify videos for restrict, notes, sharing, audit, filters, bulk scenarios.

- [ ] **Step 3: Commit if any last fixes**

```bash
git add -A
git commit -m "fix: selector corrections from extended feature test run"
```

Only commit if fixes were needed. Skip if clean.

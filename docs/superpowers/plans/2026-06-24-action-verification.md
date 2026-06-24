# Action Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all action-based tests to verify actual outcomes — download verifies file received, restrict verifies Private status in info panel, share verifies dialog closes after sending.

**Architecture:** Three independent upgrades (download, restrict, share) each touching the same two file types: feature files (scenario steps) and `steps/rms/rms.steps.ts` (step implementations). All feature files add action steps after the existing "dialog opens" assertion. Steps reuse existing helpers (`getDemsPage`, existing selectors) and add new steps only where needed.

**Tech Stack:** Playwright, playwright-bdd v9, TypeScript

## Global Constraints

- All feature files tagged `@rms`, under `features/integration/`
- Steps import `getDemsPage` from `steps/rms/fixtures.ts`
- Download File dialog reason textarea: `[placeholder="Enter reason..."]` scoped to `getByRole('dialog', { name: 'Download File' })`
- Share dialog reason textarea: `[placeholder="Enter reason..."]` scoped to `getByRole('dialog')` with text "Share evidence"
- Share email chip confirmed by blur (not Enter): fill + `.blur()`
- Restrict Private verification: reopen file after modal closes, check `[data-testid="lock-badge-private"]` OR `getByText('Private', { exact: true })` inside dialog
- Run command: `npx bddgen && npx playwright test --project=rms-chromium --headed`
- VPN required; DO NOT run tests without VPN

---

## File Map

| Action | Path |
|--------|------|
| Modify | `features/integration/rms-file-actions.feature` |
| Modify | `features/integration/rms-restrict.feature` |
| Modify | `features/integration/rms-sharing.feature` |
| Modify | `features/integration/rms-bulk.feature` |
| Modify | `steps/rms/rms.steps.ts` |

---

## Task 1: Download — complete action verification

**Files:**
- Modify: `features/integration/rms-file-actions.feature`
- Modify: `features/integration/rms-bulk.feature`
- Modify: `steps/rms/rms.steps.ts` — add download action steps

**Interfaces:**
- Produces: `When('I enter download reason {string}', ...)`, `When('I confirm the download', ...)`, `Then('the file downloads successfully', ...)`

- [ ] **Step 1: Update `features/integration/rms-file-actions.feature` Download scenario**

```gherkin
@rms
Feature: File actions in DEMS integration mode

  Background:
    Given I have opened DEMS integration from RMS record "PP 2026-12300"
    And I have opened the file "197483-905015011_medium.mp4"

  Scenario: Actions menu shows all options
    When I open the file actions menu
    Then the menu shows "Restrict"
    And the menu shows "Download"
    And the menu shows "Share"

  Scenario: Download file
    When I open the file actions menu
    And I click "Download"
    Then a download dialog or download is initiated
    When I enter download reason "QA test download"
    And I confirm the download
    Then the file downloads successfully

  Scenario: Restrict opens restriction dialog
    When I open the file actions menu
    And I click "Restrict"
    Then the restriction dialog is visible
```

- [ ] **Step 2: Update `features/integration/rms-bulk.feature` Bulk download scenario**

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
    When I enter download reason "QA bulk download"
    And I confirm the download
    Then the file downloads successfully

  Scenario: Bulk share files
    When I select the first file
    And I click bulk "Share"
    Then the share dialog is visible
```

- [ ] **Step 3: Add download action steps to `steps/rms/rms.steps.ts`**

Append these steps after the `// ─── File actions ───` comment block, before the `// ─── Search and filter ───` comment:

```typescript
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
```

- [ ] **Step 4: Run TypeScript check and bddgen**

```bash
cd C:/dems-qa && npx tsc --noEmit && npx bddgen
```

Expected: exit 0 both commands.

- [ ] **Step 5: Run download scenarios only**

```bash
npx playwright test --project=rms-chromium --headed --grep "Download"
```

Expected: 2 download tests pass (file-actions + bulk). Common failures:
- `'Download File'` dialog name mismatch → inspect dialog and update `getByRole('dialog', { name: ... })` to match actual title
- `[placeholder="Enter reason..."]` not found → try `textarea` scoped inside the dialog
- Download button regex mismatch → try `{ name: 'Download' }` without regex

Fix any failures inline before committing.

- [ ] **Step 6: Commit**

```bash
git add features/integration/rms-file-actions.feature features/integration/rms-bulk.feature steps/rms/rms.steps.ts
git commit -m "test: verify actual file download (reason + confirm + dialog closes)"
```

---

## Task 2: Restrict — verify actual Private status applied

**Files:**
- Modify: `features/integration/rms-restrict.feature`
- Modify: `features/integration/rms-bulk.feature`
- Modify: `steps/rms/rms.steps.ts` — fix `the file has a Private badge` and `the Private badge is gone`; add bulk restrict steps

**Interfaces:**
- Produces: fixed `Then('the file has a Private badge', ...)`, fixed `Then('the Private badge is gone', ...)`, `Then('the restriction was applied', ...)`

- [ ] **Step 1: Update `features/integration/rms-restrict.feature`**

Keep the same structure but ensure Private badge verification actually checks info panel:

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

(Feature file content is the same — the changes are in the step implementations below.)

- [ ] **Step 2: Update `features/integration/rms-bulk.feature` Bulk restrict scenario**

```gherkin
  Scenario: Bulk restrict files
    When I select the first file
    And I click bulk "Restrict"
    Then the restriction dialog is visible
    When I select restriction "Privatized"
    And I enter restriction reason "bulk test"
    And I confirm the restriction
    Then the restriction was applied
```

- [ ] **Step 3: Fix `the file has a Private badge` and `the Private badge is gone` in `steps/rms/rms.steps.ts`**

Replace the two existing steps:

```typescript
Then('the file has a Private badge', async function ({}) {
  const dp = getDemsPage();
  // Restrict Access modal already closed — reopen file to verify Private status in info panel
  await dp.keyboard.press('Escape');
  await dp.getByRole('row').nth(1).click();
  await dp.getByRole('dialog').waitFor({ timeout: 10_000 });
  // Check for Private badge testid OR "Private" exact text in info panel
  const privateBadge = dp.getByRole('dialog').locator('[data-testid="lock-badge-private"]')
    .or(dp.getByRole('dialog').getByText('Private', { exact: true }).first());
  await expect(privateBadge).toBeVisible({ timeout: 10_000 });
  await dp.keyboard.press('Escape');
});

Then('the Private badge is gone', async function ({}) {
  const dp = getDemsPage();
  await dp.keyboard.press('Escape');
  await dp.getByRole('row').nth(1).click();
  await dp.getByRole('dialog').waitFor({ timeout: 10_000 });
  await expect(dp.getByRole('dialog').locator('[data-testid="lock-badge-private"]')).not.toBeVisible({ timeout: 10_000 });
  await dp.keyboard.press('Escape');
});
```

- [ ] **Step 4: Add `the restriction was applied` step**

Append after the `the Private badge is gone` step:

```typescript
Then('the restriction was applied', async function ({}) {
  const dp = getDemsPage();
  // Restrict Access dialog closed — restriction was submitted
  await expect(dp.getByText('Restrict Access')).not.toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 5: Run TypeScript check and bddgen**

```bash
cd C:/dems-qa && npx tsc --noEmit && npx bddgen
```

- [ ] **Step 6: Run restrict scenarios only**

```bash
npx playwright test --project=rms-chromium --headed --grep "Restrict|restrict"
```

Expected: all restrict tests pass. Common failures:
- `[data-testid="lock-badge-private"]` not found inside dialog → the badge might not appear in the file detail dialog (only in file list). If so, use only `getByText('Private', { exact: true })` and confirm this text appears in the info panel after Privatize
- `getByRole('row').nth(1).click()` after Escape — if Escape closes both dialogs and leaves us on file list, nth(1) should be the first data row. If not, verify file list is visible first

Fix inline before committing.

- [ ] **Step 7: Commit**

```bash
git add features/integration/rms-restrict.feature features/integration/rms-bulk.feature steps/rms/rms.steps.ts
git commit -m "test: verify actual restriction applied (reopen file, check Private status)"
```

---

## Task 3: Share — actual email send verification

**Files:**
- Modify: `features/integration/rms-sharing.feature`
- Modify: `features/integration/rms-bulk.feature`
- Modify: `steps/rms/rms.steps.ts` — fix email chip, add share reason step, fix send + confirmation

**Interfaces:**
- Produces: fixed `When('I enter share email {string}', ...)`, `When('I enter share reason {string}', ...)`, fixed `When('I send the share', ...)`, fixed `Then('the share is confirmed', ...)`

- [ ] **Step 1: Update `features/integration/rms-sharing.feature`**

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
    And I enter share reason "QA test share"
    And I send the share
    Then the share is confirmed
```

- [ ] **Step 2: Update `features/integration/rms-bulk.feature` Bulk share scenario**

```gherkin
  Scenario: Bulk share files
    When I select the first file
    And I click bulk "Share"
    Then the share dialog is visible
    When I enter share email "kloselyc+1@gmail.com"
    And I enter share reason "QA bulk share"
    And I send the share
    Then the share is confirmed
```

- [ ] **Step 3: Fix share steps in `steps/rms/rms.steps.ts`**

Replace the three existing share action steps:

```typescript
When('I enter share email {string}', async function ({}, email: string) {
  const dp = getDemsPage();
  await dp.locator('[aria-label="Recipient emails"]').fill(email);
  await dp.waitForTimeout(300);
  // Blur confirms the email chip (blur event triggers addRecipient in the React component)
  await dp.locator('[aria-label="Recipient emails"]').blur();
  await dp.waitForTimeout(500);
});

When('I enter share reason {string}', async function ({}, reason: string) {
  const dp = getDemsPage();
  // Share dialog has a Reason field required before sending
  await dp.locator('[placeholder="Enter reason..."]').fill(reason);
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
```

- [ ] **Step 4: Run TypeScript check and bddgen**

```bash
cd C:/dems-qa && npx tsc --noEmit && npx bddgen
```

- [ ] **Step 5: Run share scenarios only**

```bash
npx playwright test --project=rms-chromium --headed --grep "Share|share"
```

Expected: all share tests pass. Common failures:
- `Send share link` button still disabled after blur → the share dialog may have additional required fields (subject, expiry). Inspect the dialog and look for other required inputs. Try `dp.locator('[placeholder="Enter reason..."]')` — if it doesn't find the field, the share reason might use a different placeholder (try `textarea` inside the dialog)
- Email chip not created by blur → try `await dp.locator('[aria-label="Recipient emails"]').press('Tab')` instead of `.blur()`
- Dialog does not close → check if success is shown differently (toast notification, in-dialog message)

Fix inline before committing.

- [ ] **Step 6: Commit**

```bash
git add features/integration/rms-sharing.feature features/integration/rms-bulk.feature steps/rms/rms.steps.ts
git commit -m "test: verify actual share sent (email chip + reason + dialog closes)"
```

---

## Task 4: Final verification — full suite

**Files:** none (verification only)

- [ ] **Step 1: Run full rms-chromium suite**

```bash
cd C:/dems-qa && npx bddgen && npx playwright test --project=rms-chromium --headed
```

Expected: ~45 tests, most passing. Session expiry failures on entry step are transient — re-run if needed. Fix any new regressions introduced by Task 1–3 changes.

- [ ] **Step 2: Open HTML report**

```bash
start "" "playwright-report/index.html"
```

Verify videos for download, restrict, and share scenarios confirm actual actions occur.

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -A && git commit -m "fix: regression corrections from action verification tests"
```

Only commit if fixes were needed.

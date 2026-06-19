# dems-qa

End-to-end BDD test suite for the DEMS dev environment. Hits the real dev site — no mocks, no local servers.

## Architecture

| Layer | Runner | Tags | What it tests |
|---|---|---|---|
| UI | `playwright-bdd` (TypeScript) | `@ui` | Browser interactions via Playwright |
| API | `pytest-bdd` (Python) | `@api` | HTTP calls directly to the backend |

Shared Gherkin `.feature` files drive both layers. `@ui @api` scenarios run in both.

## Prerequisites

- Node.js 20+
- Python 3.11+
- Access to `https://dems-dev.versaterm.org`

## Setup

**1. Install dependencies**

```bash
npm install
npx playwright install chromium
pip install pytest pytest-bdd httpx python-dotenv
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with real credentials:

```env
FRONTEND_URL=https://dems-dev.versaterm.org
BACKEND_URL=https://dems-dev.versaterm.org
KEYCLOAK_URL=https://auth.dems-dev.versaterm.org
KEYCLOAK_REALM=dems
KEYCLOAK_CLIENT_ID=dems-ui

TEST_OFFICER_USERNAME=your_username
TEST_OFFICER_PASSWORD=your_password
# ... fill all role credentials (or reuse same account for all roles)
```

**3. Authenticate**

```bash
npm run setup:auth
```

Opens headless Chromium, logs in via Keycloak, saves sessions to `.auth/*.json`. Re-run when sessions expire (typically after a few days or after a dev server restart).

## Running Tests

```bash
# API tests (pytest-bdd)
npm run test:api

# UI tests (playwright-bdd, headless Chromium)
npm run test:ui

# UI tests with browser visible (for debugging)
npx playwright test --headed

# Debug a single scenario step by step
npx playwright test --debug --grep "Officer uploads"
```

## Test Data

All test records use the `[E2E] ` prefix in their `external_record_id`. This makes them easy to identify and clean up.

```bash
# Preview what would be deleted (older than 24h by default)
npm run purge -- --dry-run

# Delete all [E2E] records regardless of age
PURGE_MAX_AGE_HOURS=0 npm run purge

# Custom age threshold
PURGE_MAX_AGE_HOURS=1 npm run purge
```

> **Note:** Deletion requires admin/sysops role. Standard user accounts will see 403 — records stay on dev but don't affect normal usage.

## Current Test Results

| Layer | Passed | Skipped | Failed |
|---|---|---|---|
| API | 4 | 9 | 0 |
| UI | 12 | 0 | 0 |

### Why tests are skipped

Most skips are due to using a single test account with `standard user` role. They unlock when additional role accounts are configured:

| Scenario | Requires |
|---|---|
| File lock visibility (officer2 vs sergeant1) | 2+ separate accounts |
| Cross-user upload (403 check) | 2+ separate accounts |
| Admin: view all users | `admin` or `sysops` role account |
| Retention policy | `sysops` role account |
| External share link access | Email interception (share token sent via email only) |
| Audit log 403 | Role where `/api/v1/audit/logs` is gated |
| Chain of custody export | File indexed in audit service (async) |

### Adding more accounts

1. Fill role credentials in `.env`:
   ```env
   TEST_OFFICER2_USERNAME=officer2_username
   TEST_OFFICER2_PASSWORD=officer2_password
   TEST_SUPERVISOR_USERNAME=sergeant_username
   ...
   ```
2. Re-run `npm run setup:auth`
3. Re-run `npm run test:api` — previously skipped role tests will now execute

## Writing New Scenarios

Once step definitions exist, new scenarios require only Gherkin — no TypeScript or Python. See `STEPS.md` for available steps.

**Example** — add a permission test to any `.feature` file:

```gherkin
@api
Scenario: Officer cannot access another agency's record
  Given I am logged in as "officer1"
  When I try to access a record from another agency
  Then I should receive a 403 error
```

Open a PR — tests run automatically on the next `npm run test:api`.

## Repo Structure

```
dems-qa/
├── features/               # Gherkin .feature files (shared by UI + API)
│   ├── evidence/
│   ├── sharing/
│   ├── audit/
│   └── admin/
├── steps/
│   ├── ui/                 # TypeScript — playwright-bdd step definitions
│   └── api/                # Python — pytest-bdd step definitions
├── setup/
│   └── auth.setup.ts       # Keycloak session setup (run via setup:auth)
├── fixtures/test-files/    # Upload test files (mp4, pdf, jpg, svg)
├── scripts/
│   └── purge-test-data.ts  # Cleanup script for [E2E] records
├── .auth/                  # Gitignored — saved Playwright sessions
├── .env                    # Gitignored — credentials
└── STEPS.md                # Step catalogue for product team
```

## Troubleshooting

**`setup:auth` fails — login timeout**
Dev site may be down, or Keycloak URL changed. Check `https://dems-dev.versaterm.org` is reachable.

**API tests fail with 401**
Session expired. Re-run `npm run setup:auth`.

**API tests fail with 409 Conflict**
Record with same `external_record_id` already exists. Run `npm run purge` (requires admin account), or records auto-accumulate with unique suffixes on next run.

**UI tests fail — selector not found**
A `// INSPECT:` selector needs updating. Run with `--headed` to see the browser, inspect the element, update the selector in `steps/ui/`.

**`npm run purge` — all 403**
Current account lacks delete permission. Request admin/sysops credentials from the backend team.

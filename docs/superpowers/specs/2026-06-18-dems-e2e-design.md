# DEMS E2E Test Suite Design

**Date:** 2026-06-18  
**Repo:** `C:\dems-qa`  
**Status:** Approved

---

## Overview

Standalone BDD test suite that simulates real users interacting with the DEMS dev site. No local servers — everything points at dev URLs via `.env`. Manual execution only, not integrated with CI.

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| UI runner | `playwright-bdd` | Wraps Playwright; TypeScript matches dems-ui |
| API runner | `pytest-bdd` | Python matches dems backend |
| Natural language | Gherkin `.feature` files | Shared by both layers; product-readable |
| Layer split | `@ui` / `@api` tags | Each step written once in the right layer |
| Auth strategy | Real Keycloak login | Dev site uses real Keycloak — no mocks |
| Test isolation | Each test creates own data | Avoids shared-state interference |
| Test data cleanup | `[E2E]` prefix + purge script | Decoupled from test execution; no teardown coupling |
| CI integration | None — manual only | Suite hits real dev site; not suitable for PR gating |

---

## Repo Structure

```
dems-qa/
├── features/
│   ├── evidence/
│   │   ├── upload-evidence.feature   # @ui @api
│   │   ├── view-record.feature       # @ui
│   │   └── file-lock.feature         # @api
│   ├── sharing/
│   │   └── external-share.feature    # @ui @api
│   ├── audit/
│   │   └── chain-of-custody.feature  # @api
│   └── admin/
│       ├── user-management.feature   # @ui @api
│       └── retention.feature         # @api
├── steps/
│   ├── ui/                           # TypeScript — playwright-bdd
│   │   ├── auth.setup.ts
│   │   ├── auth.steps.ts
│   │   ├── record.steps.ts
│   │   ├── file.steps.ts
│   │   └── share.steps.ts
│   └── api/                          # Python — pytest-bdd
│       ├── conftest.py
│       ├── auth_steps.py
│       ├── record_steps.py
│       └── file_steps.py
├── fixtures/test-files/
│   ├── sample.mp4
│   ├── sample.pdf
│   ├── sample.jpg
│   └── unsupported.svg
├── scripts/
│   └── purge-test-data.ts
├── .auth/                            # gitignored — Playwright saved sessions
├── .env                              # gitignored
├── .env.example
├── .gitignore                        # .auth/, .env, node_modules/, __pycache__/, .pytest_cache/
├── playwright.config.ts
├── pyproject.toml
├── package.json
└── STEPS.md
```

---

## Tag Strategy

Tags determine which runner executes each scenario. Both runners read the same `.feature` files.

- `@ui` → playwright-bdd (`npx playwright test --grep @ui`)
- `@api` → pytest-bdd (`pytest steps/api/ -v`)

| Feature | Tags | Reason |
|---|---|---|
| upload-evidence | `@ui @api` | UI confirms file appears; API confirms audit event |
| view-record | `@ui` | Visual navigation, redirect behavior |
| file-lock | `@api` | Pure permission logic — faster via HTTP |
| external-share | `@ui @api` | UI creates link; API tests expiry + token |
| chain-of-custody | `@api` | Audit data query, no UI needed |
| user-management | `@ui @api` | UI tests navigation; API tests 403 |
| retention | `@api` | Admin-only policy endpoint |

---

## Feature Files

### `features/evidence/upload-evidence.feature`

```gherkin
Feature: Evidence Upload

  @ui @api
  Scenario: Officer uploads a video file to a new record
    Given I am logged in as "officer1"
    When I create a new evidence record titled "[E2E] Incident 2026-06-18"
    And I upload the file "sample.mp4"
    Then the file should appear in the record's file list
    And an audit event "UPLOAD_COMPLETED" should exist for the file

  @api
  Scenario: Uploaded file is rejected if extension is not allowed
    Given I am logged in as "officer1"
    When I create a new evidence record titled "[E2E] Test Record"
    And I try to upload the file "unsupported.svg"
    Then I should see an error about unsupported file type

  @api
  Scenario: Officer cannot upload to another officer's record
    Given I am logged in as "officer2"
    When I try to upload a file to officer1's record
    Then I should receive a 403 error
```

### `features/evidence/view-record.feature`

```gherkin
Feature: View Evidence Record

  @ui
  Scenario: Officer views their own record
    Given I am logged in as "officer1"
    When I navigate to my records
    Then I should see my records listed

  @ui
  Scenario: Officer cannot view another officer's record
    Given I am logged in as "officer2"
    When I try to navigate to officer1's record
    Then I should be redirected or see a 403 error
```

### `features/evidence/file-lock.feature`

```gherkin
Feature: File Lock

  @api
  Scenario: Officer locks a file as private
    Given I am logged in as "officer1"
    And I have a record with an uploaded file
    When I set the file lock to "private"
    Then the file should not be visible to "officer2"
    But the file should be visible to "sergeant1"

  @api
  Scenario: Internal Affairs can view locked files
    Given a file is locked as "invisible"
    When I am logged in as "iauser"
    Then I should be able to see the file
```

### `features/sharing/external-share.feature`

```gherkin
Feature: External File Sharing

  @ui @api
  Scenario: Officer shares a file externally and recipient can download
    Given I am logged in as "officer1"
    And I have a record with an uploaded file
    When I create an external share link for the file
    Then the share link should be accessible without login
    And the recipient can download the file with a download reason

  @api
  Scenario: Expired share link shows appropriate error
    Given an external share link has expired
    When I visit the share link
    Then I should see an "expired" message
```

### `features/audit/chain-of-custody.feature`

```gherkin
Feature: Chain of Custody

  @api
  Scenario: Supervisor exports chain of custody report for a file
    Given I am logged in as "sergeant1"
    And a file has upload, view, and download events
    When I export the chain of custody for that file
    Then the export should contain all audit events in order
    And each event should include the actor's name and timestamp

  @api
  Scenario: Standard user cannot view audit logs
    Given I am logged in as "officer1"
    When I try to access the audit log
    Then I should receive a 403 error
```

### `features/admin/user-management.feature`

```gherkin
Feature: User Management

  @ui @api
  Scenario: Agency admin can view all users in their agency
    Given I am logged in as "admin"
    When I navigate to user management
    Then I should see all users belonging to my agency

  @ui @api
  Scenario: Standard user cannot access user management
    Given I am logged in as "officer1"
    When I try to navigate to user management
    Then I should be redirected or see a 403 error
```

### `features/admin/retention.feature`

```gherkin
Feature: Retention Policies

  @api
  Scenario: Sysops can set retention policy for an agency
    Given I am logged in as "sysops1"
    When I set the retention period for my agency to 90 days
    Then the retention policy should be saved

  @api
  Scenario: Standard user cannot modify retention policy
    Given I am logged in as "officer1"
    When I try to set a retention policy
    Then I should receive a 403 error
```

---

## Auth Strategy

### UI Layer — playwright-bdd

`auth.setup.ts` runs once per role before any UI tests. Saves Keycloak session to `.auth/<role>.json`. Tests load saved state — no re-login per test. `.auth/` is gitignored.

```typescript
// steps/ui/auth.setup.ts
import { setup } from '@playwright/test';

const roles = [
  { name: 'officer',  user: 'TEST_OFFICER_USERNAME',    pass: 'TEST_OFFICER_PASSWORD' },
  { name: 'sergeant', user: 'TEST_SUPERVISOR_USERNAME', pass: 'TEST_SUPERVISOR_PASSWORD' },
  { name: 'admin',    user: 'TEST_ADMIN_USERNAME',      pass: 'TEST_ADMIN_PASSWORD' },
  { name: 'iauser',   user: 'TEST_IA_USERNAME',         pass: 'TEST_IA_PASSWORD' },
  { name: 'sysops',   user: 'TEST_SYSOPS_USERNAME',     pass: 'TEST_SYSOPS_PASSWORD' },
];

for (const role of roles) {
  setup(`login as ${role.name}`, async ({ page }) => {
    await page.goto(process.env.FRONTEND_URL!);
    await page.fill('[name="username"]', process.env[role.user]!);
    await page.fill('[name="password"]', process.env[role.pass]!);
    await page.click('[type="submit"]');
    await page.waitForURL(`${process.env.FRONTEND_URL}/**`);
    await page.context().storageState({ path: `.auth/${role.name}.json` });
  });
}
```

`playwright.config.ts` declares setup as a dependency project — UI tests never run before auth completes.

### API Layer — pytest-bdd

Session-scoped fixtures fetch JWT once per role per pytest run.

```python
# steps/api/conftest.py
import os, httpx, pytest

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
REALM        = os.getenv("KEYCLOAK_REALM")
CLIENT_ID    = os.getenv("KEYCLOAK_CLIENT_ID")

def fetch_token(username, password):
    resp = httpx.post(
        f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token",
        data={"client_id": CLIENT_ID, "grant_type": "password",
              "username": username, "password": password},
    )
    resp.raise_for_status()
    return resp.json()["access_token"]

@pytest.fixture(scope="session")
def officer_token():  return fetch_token(os.getenv("TEST_OFFICER_USERNAME"),    os.getenv("TEST_OFFICER_PASSWORD"))
@pytest.fixture(scope="session")
def sergeant_token(): return fetch_token(os.getenv("TEST_SUPERVISOR_USERNAME"), os.getenv("TEST_SUPERVISOR_PASSWORD"))
@pytest.fixture(scope="session")
def admin_token():    return fetch_token(os.getenv("TEST_ADMIN_USERNAME"),      os.getenv("TEST_ADMIN_PASSWORD"))
@pytest.fixture(scope="session")
def iauser_token():   return fetch_token(os.getenv("TEST_IA_USERNAME"),         os.getenv("TEST_IA_PASSWORD"))
@pytest.fixture(scope="session")
def sysops_token():   return fetch_token(os.getenv("TEST_SYSOPS_USERNAME"),     os.getenv("TEST_SYSOPS_PASSWORD"))
```

---

## Test Data Strategy

All test-created records use prefix `[E2E] ` in titles/labels.

**Purge script** (`scripts/purge-test-data.ts`) deletes records with `[E2E]` prefix older than 24 hours. Run manually before or after test sessions.

---

## Environment Configuration

```env
# .env.example

FRONTEND_URL=https://dev.dems.versaterm.com
BACKEND_URL=https://dev-api.dems.versaterm.com

TEST_OFFICER_USERNAME=officer1
TEST_OFFICER_PASSWORD=officer1pass
TEST_OFFICER2_USERNAME=officer2
TEST_OFFICER2_PASSWORD=officer2pass
TEST_SUPERVISOR_USERNAME=sergeant1
TEST_SUPERVISOR_PASSWORD=sergeant1pass
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=adminpass
TEST_IA_USERNAME=iauser
TEST_IA_PASSWORD=iauserpass1
TEST_SYSOPS_USERNAME=sysops1
TEST_SYSOPS_PASSWORD=sysops1pass

KEYCLOAK_URL=https://auth.dems.versaterm.com
KEYCLOAK_REALM=dems
KEYCLOAK_CLIENT_ID=dems-ui
```

---

## Running the Suite

```json
// package.json scripts
{
  "test:ui":  "bddgen && playwright test --grep @ui",
  "test:api": "pytest steps/api/ -v",
  "purge":    "ts-node scripts/purge-test-data.ts"
}
```

**Typical session:**
```bash
npm run purge       # clean stale [E2E] data first
npm run test:ui     # run UI scenarios
npm run test:api    # run API scenarios
```

---

## Implementation Phases

| Phase | Scope | Est. |
|---|---|---|
| 0 — Bootstrap | Repo setup, auth helpers, .env, playwright.config.ts, pyproject.toml, STEPS.md catalogue | 1–2 days |
| 1 — Core happy path | upload-evidence + external-share (both layers) | 3–4 days |
| 2 — Permission boundaries | file-lock, cross-agency, role-gated pages | 2–3 days |
| 3 — Audit & chain of custody | Audit events, export correctness | 2 days |
| 4 — Admin workflows | User management, retention, capability gate | 2 days |
| 5 — Redaction | After redaction feature ships | TBD |

---

## Coverage Summary

| Covered | Not Covered |
|---|---|
| User workflow correctness | Performance / load testing |
| Permission boundaries | Visual regression |
| Audit trail completeness | Unit-level logic |
| Cross-service integration | — |
| Real Keycloak auth flow | — |

### Task 1: Repo Bootstrap

**Files:**
- Create: `package.json`
- Create: `playwright.config.ts`
- Create: `pyproject.toml`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: all subdirectories

**Interfaces:**
- Produces: `npm run test:ui` exits 0 with "0 tests", `npm run test:api` exits 0 with "no tests ran"

- [ ] **Step 1: Init Node project and install deps**

```bash
cd C:\dems-qa
npm init -y
npm install -D @playwright/test playwright-bdd typescript ts-node @types/node dotenv
npx playwright install chromium
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["steps/ui/**/*.ts", "scripts/**/*.ts", "playwright.config.ts"]
}
```

- [ ] **Step 3: Create playwright.config.ts**

```typescript
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['steps/ui/**/*.ts'],
  tags: '@ui',
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
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  reporter: [['html', { open: 'never' }], ['list']],
});
```

- [ ] **Step 4: Create pyproject.toml**

```toml
[build-system]
requires = ["setuptools"]
build-backend = "setuptools.backends.legacy:build"

[project]
name = "dems-qa"
version = "0.1.0"
dependencies = [
    "pytest>=7.0",
    "pytest-bdd>=6.1",
    "httpx>=0.27",
    "python-dotenv>=1.0",
]

[tool.pytest.ini_options]
testpaths = ["steps/api"]
```

- [ ] **Step 5: Install Python deps**

```bash
pip install pytest pytest-bdd httpx python-dotenv
```

- [ ] **Step 6: Update package.json scripts**

Open `package.json` and set:
```json
{
  "scripts": {
    "test:ui":    "bddgen && playwright test",
    "test:api":   "pytest steps/api/ -v",
    "setup:auth": "playwright test --project=setup",
    "purge":      "ts-node scripts/purge-test-data.ts"
  }
}
```

- [ ] **Step 7: Create .env.example**

```env
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

- [ ] **Step 8: Create .gitignore**

```gitignore
node_modules/
dist/
.auth/
.env

# Playwright
playwright-report/
test-results/

# Python
__pycache__/
*.pyc
.pytest_cache/
.venv/
```

- [ ] **Step 9: Create directory structure**

```bash
mkdir -p features/evidence features/sharing features/audit features/admin
mkdir -p steps/ui steps/api
mkdir -p fixtures/test-files
mkdir -p scripts
mkdir -p .auth
```

- [ ] **Step 10: Verify both runners start clean**

```bash
npm run test:ui
```
Expected: `Error: No tests found` or `0 passed` — no feature files yet, this is correct.

```bash
npm run test:api
```
Expected: `no tests ran` or `collected 0 items`

- [ ] **Step 11: Init git and commit**

```bash
git init
git add package.json playwright.config.ts pyproject.toml tsconfig.json .env.example .gitignore
git commit -m "chore: bootstrap dems-qa repo"
```

---


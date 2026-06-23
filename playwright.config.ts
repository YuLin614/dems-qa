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
    { name: 'setup', testDir: 'setup', testMatch: /(?<!rms-)auth\.setup\.ts/ },
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

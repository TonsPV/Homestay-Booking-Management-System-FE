import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  reporter: [['list']],
  retries: process.env.CI ? 2 : 0,
  testDir: './e2e',
  testMatch: '**/*.pw.ts',
  workers: process.env.CI ? 2 : 4,
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})

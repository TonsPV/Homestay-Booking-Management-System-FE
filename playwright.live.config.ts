import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  projects: [
    {
      name: 'live-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [['list']],
  retries: process.env.CI ? 1 : 0,
  testDir: './e2e-live',
  testMatch: '**/*.pw.ts',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})

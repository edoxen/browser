import { defineConfig, devices } from '@playwright/test'

const appPort = Number(process.env.E2E_APP_PORT ?? 4801)
const basepathPort = Number(process.env.E2E_BASEPATH_PORT ?? 4802)

export const E2E_APP_URL = `http://127.0.0.1:${appPort}`
export const E2E_BASEPATH_URL = `http://127.0.0.1:${basepathPort}`

// Two fixture sites are built and previewed by the webServer entries:
//   1. test/e2e-app          — integration mode, root base path
//   2. test/e2e-app-basepath — integration mode under /resolutions/
// A third (standalone mode) site is built on the fly by
// e2e/standalone.spec.ts itself, since it exercises the CLI end-to-end.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: E2E_APP_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
  ],
  webServer: [
    {
      command: `pnpm exec astro build --root test/e2e-app && pnpm exec astro preview --root test/e2e-app --port ${appPort} --host 127.0.0.1`,
      url: E2E_APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `pnpm exec astro build --root test/e2e-app-basepath && pnpm exec astro preview --root test/e2e-app-basepath --port ${basepathPort} --host 127.0.0.1`,
      url: `${E2E_BASEPATH_URL}/resolutions/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
})

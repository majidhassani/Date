import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trace: "on-first-retry",
    locale: "fa-IR",
  },
  projects: [
    // Uses the system Google Chrome via the "chrome" channel so no Playwright
    // browser download is required. In CI, install Playwright's own chromium
    // and remove the `channel` override.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

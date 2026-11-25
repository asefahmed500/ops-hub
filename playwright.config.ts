import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for MTO Compass end-to-end QA.
 * Base URLs default to the dedicated free ports used during QA:
 * web 3100, API 3101. Override with QA_BASE_URL / QA_API_URL.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "tests/reports/playwright-html", open: "never" }]],
  use: {
    baseURL: process.env.QA_BASE_URL || "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: false,
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    {
      name: "chromium-headed",
      use: { ...devices["Desktop Chrome"], headless: false, launchOptions: { args: ["--start-maximized"] } },
    },
  ],
});

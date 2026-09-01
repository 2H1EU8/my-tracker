import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  maxFailures: process.env.CI ? 0 : 1,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 7_500,
  },
  reporter: [
    ["dot"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    actionTimeout: 7_500,
    navigationTimeout: 15_000,
  },
});

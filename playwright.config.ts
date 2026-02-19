import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.TEST_URL || "http://localhost:3000";
const useManagedWebServer = !process.env.TEST_URL;

export default defineConfig({
  testDir: "tests",
  testMatch: ["**/*.test.ts", "**/*-test.ts", "**/*-audit.ts"],
  testIgnore: ["**/smoke-test.ts"],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: useManagedWebServer
    ? {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

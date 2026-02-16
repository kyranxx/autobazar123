import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: ["**/*.test.ts", "**/*-test.ts", "**/*-audit.ts"],
  testIgnore: ["**/smoke-test.ts"],
  outputDir: "test-results",
  use: {
    baseURL: process.env.TEST_URL || "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

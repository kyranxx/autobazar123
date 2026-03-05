import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.TEST_URL || "http://localhost:3000";
const useManagedWebServer = !process.env.TEST_URL;
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || "npm run dev";
const reuseExistingWebServer = process.env.PLAYWRIGHT_REUSE_SERVER === "true";
const mobileCoverageMatch = [
  "**/accessibility-gate.test.ts",
  "**/keyboard-navigation.test.ts",
  "**/reflow-zoom.test.ts",
  "**/screen-reader-proxy.test.ts",
  "**/web-interface-guidelines.test.ts",
  "**/web-interface-sitewide.test.ts",
];

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
        command: webServerCommand,
        url: "http://localhost:3000",
        reuseExistingServer: reuseExistingWebServer,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-pixel-7",
      testMatch: mobileCoverageMatch,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-iphone-13-landscape",
      testMatch: mobileCoverageMatch,
      use: {
        browserName: "chromium",
        ...devices["iPhone 13"],
        viewport: { width: 844, height: 390 },
      },
    },
  ],
});

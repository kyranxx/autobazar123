import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const baseURL = process.env.TEST_URL || "http://localhost:3000";
const normalizedBaseURL = baseURL.replace(/\/$/, "");
const useManagedWebServer = !process.env.TEST_URL;
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || "npm run dev";
const isLocalPlaywrightBaseUrl =
  /^(http:\/\/localhost:3000|http:\/\/127\.0\.0\.1:3000)$/.test(normalizedBaseURL);
const reuseExistingWebServer =
  process.env.PLAYWRIGHT_REUSE_SERVER === "true" ||
  (process.env.PLAYWRIGHT_REUSE_SERVER !== "false" && isLocalPlaywrightBaseUrl);
const webServerReadyUrl =
  process.env.PLAYWRIGHT_WEB_SERVER_READY_URL ||
  (isLocalPlaywrightBaseUrl ? `${normalizedBaseURL}/auth/login` : normalizedBaseURL);
const playwrightOutputDir =
  process.env.PLAYWRIGHT_OUTPUT_DIR ||
  path.join(os.tmpdir(), "autoninja-playwright");
const chromiumChannel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || undefined;
const chromiumChannelUse = chromiumChannel ? { channel: chromiumChannel } : {};
const configuredWorkers = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : undefined;
const defaultWorkers =
  useManagedWebServer && isLocalPlaywrightBaseUrl ? 1 : undefined;
export default defineConfig({
  testDir: "tests",
  testMatch: ["**/*.test.ts", "**/*-test.ts", "**/*-audit.ts"],
  testIgnore: ["**/smoke-test.ts"],
  outputDir: playwrightOutputDir,
  workers: Number.isFinite(configuredWorkers) ? configuredWorkers : defaultWorkers,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: useManagedWebServer
    ? {
        command: webServerCommand,
        url: webServerReadyUrl,
        reuseExistingServer: reuseExistingWebServer,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], ...chromiumChannelUse },
    },
  ],
});

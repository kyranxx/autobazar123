import { BrowserManager } from "agent-browser/dist/browser.js";

const baseUrl = process.env.TEST_URL || "http://localhost:3000";
const routes = ["/", "/auth/login", "/auth/register", "/pridat-inzerat", "/vysledky"];

function buildUrl(route) {
  return new URL(route, baseUrl).toString();
}

async function run() {
  const browser = new BrowserManager();

  try {
    await browser.launch({
      id: "smoke-launch",
      action: "launch",
      headless: true,
      browser: "chromium",
    });

    const page = browser.getPage();

    for (const route of routes) {
      const url = buildUrl(route);
      console.log(`Checking route: ${url}`);

      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });

      if (!response) {
        throw new Error(`No response when opening ${url}`);
      }

      const status = response.status();
      if (status >= 400) {
        throw new Error(`Route ${url} returned HTTP ${status}`);
      }

      const snapshot = await browser.getSnapshot({
        interactive: true,
        compact: true,
        maxDepth: 6,
      });

      const snapshotText =
        snapshot && typeof snapshot.tree === "string" ? snapshot.tree : "";

      if (!snapshotText.trim()) {
        throw new Error(`Interactive snapshot is empty for ${url}`);
      }
    }

    console.log("Agent-browser smoke checks passed.");
  } finally {
    await browser.close().catch(() => undefined);
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Agent-browser smoke checks failed: ${message}`);
  process.exit(1);
});

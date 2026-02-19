import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

const ROUTES_TO_CHECK = [
  "/",
  "/vysledky",
  "/kredity",
  "/ceny",
  "/kalkulacka-leasingu",
  "/kontakt",
  "/predajcovia",
  "/o-nas",
  "/cookies",
  "/obchodne-podmienky",
  "/ochrana-udajov",
  "/auth/login",
  "/auth/register",
];

const HYDRATION_PATTERNS = [
  /react-hydration-error/i,
  /a tree hydrated but some attributes of the server rendered html didn't match/i,
  /hydration failed/i,
  /text content does not match server-rendered html/i,
  /didn't match the client properties/i,
];

function isHydrationMessage(text: string): boolean {
  return HYDRATION_PATTERNS.some((pattern) => pattern.test(text));
}

async function visitAndStabilize(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 });
  await page.waitForTimeout(450);
}

test("no hydration mismatches on critical routes", async ({ page }) => {
  test.setTimeout(180_000);

  const issues: Array<{ route: string; source: string; text: string }> = [];
  let activeRoute = "";

  page.on("console", (msg: ConsoleMessage) => {
    const type = msg.type();
    if (type !== "error" && type !== "warning") return;

    const text = msg.text();
    if (!isHydrationMessage(text)) return;

    issues.push({
      route: activeRoute || "(unknown-route)",
      source: `console:${type}`,
      text,
    });
  });

  page.on("pageerror", (error) => {
    const text = error instanceof Error ? error.message : String(error);
    if (!isHydrationMessage(text)) return;

    issues.push({
      route: activeRoute || "(unknown-route)",
      source: "pageerror",
      text,
    });
  });

  for (const route of ROUTES_TO_CHECK) {
    activeRoute = route;
    await visitAndStabilize(page, route);
  }

  expect(issues, JSON.stringify(issues, null, 2)).toHaveLength(0);
});

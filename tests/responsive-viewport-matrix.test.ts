import { expect, test } from "@playwright/test";

const PRIORITY_VIEWPORTS = [
  { name: "accessibility floor", width: 320, height: 568 },
  { name: "compact Android", width: 360, height: 780 },
  { name: "compact iPhone", width: 375, height: 812 },
  { name: "standard iPhone", width: 390, height: 844 },
  { name: "modern Android", width: 414, height: 896 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "phone landscape", width: 844, height: 390 },
  { name: "tablet landscape", width: 1024, height: 768 },
  { name: "common laptop", width: 1366, height: 768 },
  { name: "large laptop", width: 1536, height: 864 },
  { name: "full HD", width: 1920, height: 1080 },
  { name: "scaled 4K reference", width: 2560, height: 1440 },
] as const;

test.describe("Priority responsive viewport matrix", () => {
  test.describe.configure({ timeout: 180_000 });

  for (const viewport of PRIORITY_VIEWPORTS) {
    test(`/vysledky fits ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/vysledky", { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(
        dimensions.scrollWidth,
        `Document width ${dimensions.scrollWidth}px exceeds ${dimensions.clientWidth}px`,
      ).toBeLessThanOrEqual(dimensions.clientWidth + 2);
    });
  }

  test("320px header keeps the signed-out action on one line", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/vysledky", { waitUntil: "domcontentloaded" });

    const loginButton = page.locator("header button").first();
    await expect(loginButton).toBeVisible();

    const lineCount = await loginButton.evaluate((button) => {
      const textNode = Array.from(button.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (!textNode) return 0;

      const range = document.createRange();
      range.selectNodeContents(textNode);
      return range.getClientRects().length;
    });

    expect(lineCount).toBe(1);
  });

  test("320px first-visit cookie banner stays compact", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/vysledky", { waitUntil: "domcontentloaded" });

    const banner = page.locator(".fixed.bottom-2.left-2");
    await expect(banner).toBeVisible({ timeout: 5_000 });

    const box = await banner.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(210);
  });
});

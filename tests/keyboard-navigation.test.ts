import { expect, test } from "@playwright/test";

function getPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

async function openMobileMenu(page: import("@playwright/test").Page) {
  const menuButton = page.locator('button[aria-controls="mobile-nav-dialog"]').first();
  await expect(menuButton).toBeVisible();
  await menuButton.focus();
  await expect(menuButton).toBeFocused();

  const dialog = page.locator("#mobile-nav-dialog");

  // Retry a few times to handle slow client hydration in CI/dev.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await menuButton.press("Enter");
    if (await dialog.isVisible()) {
      break;
    }

    await menuButton.press(" ");
    if (await dialog.isVisible()) {
      break;
    }

    await menuButton.click();
    if (await dialog.isVisible()) {
      break;
    }

    await page.waitForTimeout(150);
  }

  await expect(dialog).toBeVisible();
  return { dialog, menuButton };
}

test.describe("Keyboard-only navigation", () => {
  test("skip link is keyboard reachable and targets main content", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    await page.keyboard.press("Tab");

    const skipLink = page.locator('a[href="#main-content"]').first();
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");

    const isMobileLayout = await page.evaluate(() =>
      window.matchMedia("(max-width: 767px)").matches,
    );
    if (!isMobileLayout) {
      await expect(page).toHaveURL(/#main-content$/);
    }
  });

  test("mobile menu can be fully controlled by keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    const { dialog, menuButton } = await openMobileMenu(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test("header navigation works with keyboard activation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const desktopResultsLink = page
      .locator('nav[aria-label="Hlavná navigácia"] a[href="/vysledky"]')
      .first();
    const desktopLinkVisible = await desktopResultsLink.isVisible();

    if (desktopLinkVisible) {
      await desktopResultsLink.focus();
      await expect(desktopResultsLink).toBeFocused();
      await page.keyboard.press("Enter");
    } else {
      await openMobileMenu(page);

      const mobileResultsLink = page
        .locator('#mobile-nav-dialog a[href="/vysledky"]')
        .first();
      await expect(mobileResultsLink).toBeVisible();
      await mobileResultsLink.focus();
      await expect(mobileResultsLink).toBeFocused();
      await page.keyboard.press("Enter");
    }

    await expect
      .poll(() => getPathname(page.url()), {
        timeout: 10_000,
      })
      .toBe("/vysledky");
  });
});

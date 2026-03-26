import { expect, test, type Locator, type Page } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const TOUCH_STEPS = 10;

async function getBoundingBox(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error("Expected locator to have a bounding box");
  }

  return box;
}

async function dragWithTouch(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
  steps = TOUCH_STEPS,
) {
  const session = await page.context().newCDPSession(page);
  const createTouchPoint = (x: number, y: number) => ({
    x,
    y,
    radiusX: 4,
    radiusY: 4,
    force: 1,
    id: 1,
  });

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [createTouchPoint(start.x, start.y)],
  });

  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        createTouchPoint(
          start.x + (end.x - start.x) * progress,
          start.y + (end.y - start.y) * progress,
        ),
      ],
    });
    await page.waitForTimeout(16);
  }

  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
}

async function getScrollLeft(locator: Locator) {
  return locator.evaluate((element) => element.scrollLeft);
}

async function getOverscrollBehavior(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      x: style.overscrollBehaviorX,
      y: style.overscrollBehaviorY,
    };
  });
}

test.describe("Homepage featured rows touch behavior", () => {
  test.describe.configure({ timeout: 120_000 });
  test.use({
    viewport: MOBILE_VIEWPORT,
    hasTouch: true,
    isMobile: true,
  });

  test("vertical swipe after arrow scroll does not drag the carousel or navigate", async ({ page }) => {
    await page.goto("/");

    const row = page.getByTestId("home-featured-row-0");
    const rowRightArrow = page.getByTestId("home-featured-row-0-scroll-right");
    await expect(row).toBeVisible();
    await expect(rowRightArrow).toBeVisible();

    await expect.poll(() => getOverscrollBehavior(row)).toEqual({
      x: "contain",
      y: "auto",
    });

    await rowRightArrow.click();
    await page.waitForTimeout(450);

    const box = await getBoundingBox(row);
    const beforeScrollLeft = await getScrollLeft(row);

    expect(beforeScrollLeft).toBeGreaterThan(40);

    await dragWithTouch(
      page,
      {
        x: box.x + box.width * 0.68,
        y: box.y + box.height * 0.78,
      },
      {
        x: box.x + box.width * 0.64,
        y: box.y + box.height * 0.2,
      },
    );

    await page.waitForTimeout(250);

    const afterScrollLeft = await getScrollLeft(row);
    expect(Math.abs(afterScrollLeft - beforeScrollLeft)).toBeLessThan(8);
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("horizontal swipe scrolls the row without navigating away", async ({ page }) => {
    await page.goto("/");

    const row = page.getByTestId("home-featured-row-0");
    await expect(row).toBeVisible();
    await row.scrollIntoViewIfNeeded();

    const box = await getBoundingBox(row);
    const beforeScrollLeft = await getScrollLeft(row);

    await dragWithTouch(
      page,
      {
        x: box.x + box.width * 0.8,
        y: box.y + box.height * 0.5,
      },
      {
        x: box.x + box.width * 0.22,
        y: box.y + box.height * 0.54,
      },
    );

    await page.waitForTimeout(250);

    const afterScrollLeft = await getScrollLeft(row);
    expect(afterScrollLeft).toBeGreaterThan(beforeScrollLeft + 40);
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("arrow buttons scroll rows independently", async ({ page }) => {
    await page.goto("/");

    const firstRow = page.getByTestId("home-featured-row-0");
    const secondRow = page.getByTestId("home-featured-row-1");
    const firstRowRightArrow = page.getByTestId("home-featured-row-0-scroll-right");
    const secondRowRightArrow = page.getByTestId("home-featured-row-1-scroll-right");

    await expect(firstRow).toBeVisible();
    await expect(secondRow).toBeVisible();

    await firstRowRightArrow.click();
    await page.waitForTimeout(450);

    const firstRowAfterFirstClick = await getScrollLeft(firstRow);
    const secondRowAfterFirstClick = await getScrollLeft(secondRow);

    expect(firstRowAfterFirstClick).toBeGreaterThan(40);
    expect(secondRowAfterFirstClick).toBeLessThan(5);

    await secondRowRightArrow.click();
    await page.waitForTimeout(450);

    const firstRowAfterSecondClick = await getScrollLeft(firstRow);
    const secondRowAfterSecondClick = await getScrollLeft(secondRow);

    expect(secondRowAfterSecondClick).toBeGreaterThan(40);
    expect(Math.abs(firstRowAfterSecondClick - firstRowAfterFirstClick)).toBeLessThan(8);
  });
});

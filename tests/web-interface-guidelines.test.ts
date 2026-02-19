import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/vysledky", "/auth/login", "/auth/register", "/kredity"];

test.describe("Web interface guidelines", () => {
  for (const route of ROUTES) {
    test(`${route} keeps semantic and accessibility baseline`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      await expect
        .poll(async () => page.locator("main").count(), {
          timeout: 10_000,
        })
        .toBeGreaterThan(0);

      await expect
        .poll(async () => page.locator("h1").count(), {
          timeout: 10_000,
        })
        .toBeGreaterThan(0);

      const unlabeledControls = await page
        .locator("button, input, select, textarea")
        .evaluateAll((elements) => {
          const getLabelText = (element: Element): string => {
            const ariaLabel = element.getAttribute("aria-label")?.trim() || "";
            if (ariaLabel) return ariaLabel;

            const labelledBy = element.getAttribute("aria-labelledby")?.trim() || "";
            if (labelledBy) {
              return labelledBy
                .split(/\s+/)
                .map((id) => document.getElementById(id)?.textContent?.trim() || "")
                .join(" ")
                .trim();
            }

            const id = element.getAttribute("id");
            if (id) {
              const directLabel = document.querySelector(`label[for="${id}"]`);
              if (directLabel?.textContent?.trim()) {
                return directLabel.textContent.trim();
              }
            }

            const wrappedLabel = element.closest("label");
            if (wrappedLabel?.textContent?.trim()) {
              return wrappedLabel.textContent.trim();
            }

            const placeholder = (element as HTMLInputElement).placeholder?.trim() || "";
            if (placeholder) return placeholder;

            return element.textContent?.trim() || "";
          };

          return elements
            .filter((element) => {
              const htmlElement = element as HTMLElement;
              if (htmlElement.offsetParent === null) return false;
              if (element instanceof HTMLInputElement && element.type === "hidden") {
                return false;
              }
              return true;
            })
            .map((element) => {
              const label = getLabelText(element);
              return {
                tag: element.tagName.toLowerCase(),
                type: (element as HTMLInputElement).type || "",
                id: element.getAttribute("id") || "",
                label,
              };
            })
            .filter((entry) => entry.label.length === 0)
            .slice(0, 10);
        });

      expect(unlabeledControls, JSON.stringify(unlabeledControls, null, 2)).toEqual([]);

      const imagesMissingAlt = await page.locator("img").evaluateAll((images) => {
        return images
          .filter((img) => {
            const alt = img.getAttribute("alt");
            return alt === null || alt.trim().length === 0;
          })
          .map((img) => img.getAttribute("src") || "unknown")
          .slice(0, 10);
      });

      expect(imagesMissingAlt, JSON.stringify(imagesMissingAlt, null, 2)).toEqual([]);
    });
  }
});

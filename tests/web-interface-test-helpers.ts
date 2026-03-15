import type { Browser, Page } from "@playwright/test";

const STATIC_FILE_PATTERN = /\.(xml|txt|json|ico|css|js|map|png|jpe?g|webp|gif|svg)$/i;

function normalizeRoutePath(baseUrl: string, input: string): string | null {
  try {
    const base = new URL(baseUrl);
    const url = new URL(input, baseUrl);
    if (url.origin !== base.origin) {
      return null;
    }

    const cleaned = `${url.pathname}${url.search}`;
    if (STATIC_FILE_PATTERN.test(url.pathname)) {
      return null;
    }
    if (!cleaned.startsWith("/")) {
      return null;
    }
    if (cleaned.startsWith("/_next") || cleaned.startsWith("/api/")) {
      return null;
    }
    if (cleaned === "") {
      return "/";
    }

    return cleaned.endsWith("/") && cleaned !== "/" ? cleaned.slice(0, -1) : cleaned;
  } catch {
    return null;
  }
}

export async function getRoutesFromSitemap(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`);
    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

    return matches
      .map((loc) => normalizeRoutePath(baseUrl, loc))
      .filter((route): route is string => !!route);
  } catch {
    return [];
  }
}

export async function getRoutesFromHomepageLinks(
  baseUrl: string,
  browser: Browser,
): Promise<string[]> {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]"))
        .map((anchor) => anchor.getAttribute("href") || "")
        .filter(Boolean),
    );

    return links
      .map((href) => normalizeRoutePath(baseUrl, href))
      .filter((route): route is string => !!route);
  } catch {
    return [];
  } finally {
    await context.close();
  }
}

export async function findUnlabeledControls(page: Page) {
  return page.locator("button, input, select, textarea").evaluateAll((elements) => {
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
          className: element.getAttribute("class") || "",
          label,
        };
      })
      .filter((entry) => entry.label.length === 0);
  });
}

export async function findImagesMissingAlt(page: Page) {
  return page.locator("img").evaluateAll((images) =>
    images
      .filter((img) => {
        const className = img.getAttribute("class") || "";
        const src = img.getAttribute("src") || "";
        const isLeafletTile =
          className.includes("leaflet-tile") || src.includes("tile.openstreetmap.org");
        if (isLeafletTile) return false;

        const alt = img.getAttribute("alt");
        return alt === null || alt.trim().length === 0;
      })
      .map((img) => ({
        src: img.getAttribute("src") || "unknown",
        className: img.getAttribute("class") || "",
      })),
  );
}

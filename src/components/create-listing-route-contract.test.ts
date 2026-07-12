import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CANONICAL_CREATE_LISTING_ROUTE = "/moj-ucet?tab=create";
const LEGACY_CREATE_LISTING_ROUTE = "/pridat-inzerat";

function readProjectFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("create-listing route contract", () => {
  it("defines the canonical create-listing route as the account create tab", () => {
    const source = readProjectFile("src/lib/routes.ts");

    expect(source).toContain(
      `CREATE_LISTING_ROUTE = "${CANONICAL_CREATE_LISTING_ROUTE}"`,
    );
  });

  it("keeps the navbar add-listing CTA for authenticated header state only", () => {
    const source = readProjectFile("src/components/Navbar.tsx");

    expect(source).toContain("href={CREATE_LISTING_ROUTE}");
    expect(source).toContain(`{t("addListing")}`);
    expect(source).not.toContain("CREATE_LISTING_REGISTER_ROUTE");
    expect(source).not.toContain("createListingHref");
  });

  it("keeps personal dashboard destinations in the signed-in account menu", () => {
    const source = readProjectFile("src/components/Navbar.tsx");

    expect(source).toContain("const accountDashboardLinks: NavLink[] = [");
    expect(source).toContain('href: "/moj-ucet?tab=ads"');
    expect(source).toContain('label: tDashboard("myAds")');
    expect(source).toContain('label: tDashboard("addListingTab")');
    expect(source).toContain('href: "/moj-ucet?tab=saved"');
    expect(source).toContain('label: tDashboard("savedCars")');
    expect(source).toContain('href: "/moj-ucet?tab=messages"');
    expect(source).toContain('label: tDashboard("messages")');
    expect(source).toContain('href: "/moj-ucet?tab=settings"');
    expect(source).toContain('label: tDashboard("settings")');
    expect(source).not.toContain('href="/ulozene"');
    expect(source).not.toContain('safeNavigate("/ulozene")');
    expect(source).not.toContain('safeKeyboardNavigate("/ulozene")');
  });

  it("gives visitors a filled accent login action", () => {
    const source = readProjectFile("src/components/Navbar.tsx");
    const loggedOutHeader = source.slice(
      source.indexOf("{!user ? ("),
      source.indexOf(") : (", source.indexOf("{!user ? (")),
    );

    expect(loggedOutHeader).toContain("bg-[var(--color-accent)]");
    expect(loggedOutHeader).toContain("text-[var(--color-accent-foreground)]");
  });

  it("opens the signed-in account menu from an accessible button", () => {
    const source = readProjectFile("src/components/Navbar.tsx");

    expect(source).toContain('aria-haspopup="menu"');
    expect(source).toContain("onClick={onToggleMenu}");
    expect(source).toContain("onToggleMenu: () => void;");
  });

  it.each([
    "src/components/Navbar.tsx",
    "src/components/home/HomePageShell.tsx",
    "src/components/Footer.tsx",
    "src/app/(site)/ceny/page.tsx",
    "src/app/(site)/dealer/DealerDashboardClient.tsx",
    "src/app/(site)/moj-ucet/DashboardClient.tsx",
  ])("%s links add-listing CTAs directly to the account create tab", (relativePath) => {
    const source = readProjectFile(relativePath);

    expect(
      source.includes(CANONICAL_CREATE_LISTING_ROUTE) ||
        source.includes("CREATE_LISTING_ROUTE"),
    ).toBe(true);
    expect(source).not.toContain(`href="${LEGACY_CREATE_LISTING_ROUTE}"`);
    expect(source).not.toContain(`safeNavigate("${LEGACY_CREATE_LISTING_ROUTE}")`);
    expect(source).not.toContain(
      `safeKeyboardNavigate("${LEGACY_CREATE_LISTING_ROUTE}")`,
    );
  });

  it("keeps the old add-listing URL as an explicit server redirect only", () => {
    const legacyPageSource = readProjectFile("src/app/(site)/pridat-inzerat/page.tsx");

    expect(legacyPageSource).toContain("redirect(CREATE_LISTING_ROUTE)");
    expect(legacyPageSource).not.toContain("<MarketplacePageShell>");
    expect(
      existsSync(
        path.join(process.cwd(), "src/app/(site)/pridat-inzerat/RedirectToAccount.tsx"),
      ),
    ).toBe(false);
  });
});

import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import SearchPage from "./page";

vi.mock("@/components/theme/ThemePreviewShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./AlgoliaSearchPageClient", () => ({
  default: () => null,
}));

vi.mock("./SearchSeoLinks", () => ({
  default: () => null,
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(async () => "sk"),
  getTranslations: vi.fn(async () => (key: string) =>
    key === "srHeading" ? "Výsledky vyhľadávania áut na Slovensku" : key,
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({ youAreHere: "Ste tu:", ariaLabel: "Navigácia v omrvinkách" })[key] ?? key,
}));

describe("SearchPage", () => {
  it("renders a server-visible h1 for crawlers before the client search app loads", async () => {
    const page = await SearchPage({});

    render(page);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Výsledky vyhľadávania áut na Slovensku",
      }),
    ).toBeInTheDocument();
  });

  it("renders brand and model breadcrumbs from search params", async () => {
    const page = await SearchPage({
      searchParams: Promise.resolve({ brand: "Škoda", model: "Octavia" }),
    });

    const { container } = render(page);
    const breadcrumb = within(container).getByRole("navigation", {
      name: "Navigácia v omrvinkách",
    });

    expect(within(breadcrumb).getByText("Ste tu:")).toBeInTheDocument();
    expect(within(breadcrumb).getByRole("link", { name: "Inzeráty" })).toHaveAttribute(
      "href",
      "/vysledky",
    );
    expect(within(breadcrumb).getByRole("link", { name: "Škoda" })).toHaveAttribute(
      "href",
      "/vysledky?brand=%C5%A0koda",
    );
    expect(within(breadcrumb).getByText("Octavia")).toBeInTheDocument();
  });
});

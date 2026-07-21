import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import Footer from "./Footer";

const { useLocaleMock, usePathnameMock } = vi.hoisted(() => ({
  useLocaleMock: vi.fn(() => "sk"),
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => useLocaleMock(),
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values?.year ? `${key} ${values.year}` : key,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    prefetch,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    prefetch?: boolean;
    children: ReactNode;
  }) => (
    <a
      href={href}
      data-prefetch={prefetch === undefined ? undefined : String(prefetch)}
      {...props}
    >
      {children}
    </a>
  ),
}));

describe("Footer", () => {
  it("uses the visible brand text as the footer home link accessible name", () => {
    useLocaleMock.mockReturnValue("sk");
    usePathnameMock.mockReturnValue("/cookies");

    render(<Footer currentYear={2026} />);

    expect(screen.getByRole("link", { name: "Autobazar123.sk" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("uses the Romanian domain label on Romanian market pages", () => {
    useLocaleMock.mockReturnValue("ro");
    usePathnameMock.mockReturnValue("/cookies");

    render(<Footer currentYear={2026} />);

    expect(screen.getByRole("link", { name: "AutoNinja.ro" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("does not prefetch footer links from the global footer", () => {
    useLocaleMock.mockReturnValue("sk");
    usePathnameMock.mockReturnValue("/cookies");

    render(<Footer currentYear={2026} />);

    for (const href of [
      "/",
      "/vysledky",
      "/predajcovia",
      "/ceny",
      "/kontakt",
      "/moj-ucet?tab=create",
      "/dealer",
      "/moj-ucet",
      "/o-nas",
      "/obchodne-podmienky",
      "/ochrana-udajov",
      "/cookies",
      "/site-map",
    ]) {
      const links = screen
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href") === href);

      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link).toHaveAttribute("data-prefetch", "false");
      }
    }
  });
});

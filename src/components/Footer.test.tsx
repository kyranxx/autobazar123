import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import Footer from "./Footer";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("next-intl", () => ({
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
  it("does not prefetch protected account or dealer links from the global footer", () => {
    usePathnameMock.mockReturnValue("/cookies");

    render(<Footer currentYear={2026} />);

    for (const href of ["/moj-ucet?tab=create", "/moj-ucet", "/dealer"]) {
      const links = screen
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href") === href);

      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link).toHaveAttribute("data-prefetch", "false");
      }
    }

    expect(
      screen
        .getAllByRole("link")
        .find((link) => link.getAttribute("href") === "/ceny"),
    ).not.toHaveAttribute("data-prefetch", "false");
  });
});

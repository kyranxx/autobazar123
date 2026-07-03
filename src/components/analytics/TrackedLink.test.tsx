import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrackedLink } from "./TrackedLink";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

vi.mock("@/lib/analytics/client", () => ({
  trackAnalyticsEvent: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    onClick,
    ...props
  }: {
    children: ReactNode;
    href: string;
    prefetch?: boolean;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a
      href={href}
      data-prefetch={prefetch === undefined ? undefined : String(prefetch)}
      onClick={onClick}
      {...props}
    >
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TrackedLink", () => {
  it("does not prefetch tracked internal links by default", () => {
    render(
      <TrackedLink
        href="/vysledky"
        analyticsEventName="homepage_cta_clicked"
        analyticsPayload={{
          cta: "all_cars",
          surface: "home_quick_search",
          destination: "/vysledky",
        }}
      >
        Všetky autá
      </TrackedLink>,
    );

    expect(screen.getByRole("link", { name: "Všetky autá" })).toHaveAttribute(
      "data-prefetch",
      "false",
    );
  });

  it("keeps click analytics behavior", () => {
    render(
      <TrackedLink
        href="/vysledky"
        analyticsEventName="homepage_cta_clicked"
        analyticsPayload={{
          cta: "all_cars",
          surface: "home_quick_search",
          destination: "/vysledky",
        }}
      >
        Všetky autá
      </TrackedLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Všetky autá" }));

    expect(trackAnalyticsEvent).toHaveBeenCalledWith("homepage_cta_clicked", {
      cta: "all_cars",
      surface: "home_quick_search",
      destination: "/vysledky",
    });
  });
});

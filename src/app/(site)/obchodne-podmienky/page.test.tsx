import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TermsPage from "./page";

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(async () => "sk"),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({ youAreHere: "Ste tu:", ariaLabel: "Navigácia v omrvinkách" })[key] ?? key,
}));

describe("TermsPage", () => {
  it("renders a breadcrumb for the static legal page", async () => {
    render(await TermsPage());

    expect(screen.getByText("Ste tu:")).toBeInTheDocument();
    expect(screen.getAllByText("Obchodné podmienky").length).toBeGreaterThan(0);
  });
});

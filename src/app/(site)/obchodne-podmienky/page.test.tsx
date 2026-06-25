import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TermsPage from "./page";

describe("TermsPage", () => {
  it("renders a breadcrumb for the static legal page", () => {
    render(<TermsPage />);

    expect(screen.getByText("Ste tu:")).toBeInTheDocument();
    expect(screen.getAllByText("Obchodné podmienky").length).toBeGreaterThan(0);
  });
});

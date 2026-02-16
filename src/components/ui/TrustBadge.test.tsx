import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustBadge } from "./TrustBadge";

describe("TrustBadge", () => {
  it("renders the provided label", () => {
    render(<TrustBadge label="Overené vozidlo" />);
    expect(screen.getByText("Overené vozidlo")).toBeInTheDocument();
  });

  it("renders a check icon", () => {
    const { container } = render(<TrustBadge label="Trusted" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

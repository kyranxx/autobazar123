import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustSignal } from "./TrustSignal";

describe("TrustSignal", () => {
  it("renders icon and label text", () => {
    render(<TrustSignal icon="✅" label="Servisná história" active />);

    expect(screen.getByText("✅")).toBeInTheDocument();
    expect(screen.getByText("Servisná história")).toBeInTheDocument();
  });

  it("uses active classes when active is true", () => {
    const { container } = render(
      <TrustSignal icon="✅" label="Aktívne" active />,
    );

    expect(container.firstChild).toHaveClass("bg-success/10");
    expect(container.firstChild).toHaveClass("text-success");
  });

  it("uses inactive classes when active is false", () => {
    const { container } = render(
      <TrustSignal icon="❌" label="Neaktívne" active={false} />,
    );

    expect(container.firstChild).toHaveClass("bg-surface");
    expect(container.firstChild).toHaveClass("text-secondary");
  });
});

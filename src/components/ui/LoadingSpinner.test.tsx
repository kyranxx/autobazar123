import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders an animated SVG spinner", () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector("svg");

    expect(svg).not.toBeNull();
    expect(svg?.className.baseVal).toContain("animate-spin");
  });

  it("applies custom class names", () => {
    const { container } = render(<LoadingSpinner className="size-8 text-red-500" />);
    const svg = container.querySelector("svg");

    expect(svg?.className.baseVal).toContain("size-8");
    expect(svg?.className.baseVal).toContain("text-red-500");
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PriceRangeInput } from "./FilterSidebar";

const useRangeMock = vi.fn();

vi.mock("react-instantsearch", () => ({
  RefinementList: () => null,
  ToggleRefinement: () => null,
  useRefinementList: () => ({ items: [], refine: vi.fn() }),
  RangeInput: () => <div data-testid="mock-range-input" />,
  useRange: (...args: unknown[]) => useRangeMock(...args),
}));

describe("PriceRangeInput quick buttons", () => {
  beforeEach(() => {
    useRangeMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("applies max price refinement when quick-price button is clicked", () => {
    const refine = vi.fn();
    useRangeMock.mockReturnValue({
      canRefine: true,
      range: { min: 1000, max: 120000 },
      start: [1000, undefined],
      refine,
    });

    render(<PriceRangeInput attribute="price_eur" />);
    fireEvent.click(screen.getByRole("button", { name: "<= 10k EUR" }));

    expect(refine).toHaveBeenCalledWith([1000, 10000]);
  });

  it("disables quick-price buttons when range cannot refine", () => {
    useRangeMock.mockReturnValue({
      canRefine: false,
      range: { min: undefined, max: undefined },
      start: [undefined, undefined],
      refine: vi.fn(),
    });

    render(<PriceRangeInput attribute="price_eur" />);
    expect(screen.getByRole("button", { name: "<= 5k EUR" })).toBeDisabled();
  });
});

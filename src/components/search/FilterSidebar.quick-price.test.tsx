import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PriceRangeInput } from "./FilterSidebar";

const useRangeMock = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (key === "upToLabel") {
      return `Up to ${values?.value}`;
    }
    if (key === "newerThanLabel") {
      return `From ${values?.value}`;
    }
    if (key === "apply") {
      return "Apply";
    }
    if (key === "from") {
      return "From";
    }
    if (key === "to") {
      return "To";
    }
    return key;
  },
}));

vi.mock("react-instantsearch", () => ({
  RefinementList: () => null,
  ToggleRefinement: () => null,
  useRefinementList: () => ({ items: [], refine: vi.fn() }),
  useToggleRefinement: () => ({ value: { isRefined: false }, refine: vi.fn() }),
  useStats: () => ({ nbHits: 0 }),
  useClearRefinements: () => ({ canRefine: false, refine: vi.fn() }),
  useCurrentRefinements: () => ({ items: [] }),
  RangeInput: () => <div data-testid="mock-range-input" />,
  useRange: (...args: unknown[]) => useRangeMock(...args),
}));

describe("PriceRangeInput exact values", () => {
  beforeEach(() => {
    useRangeMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("applies exact price refinement when the form is submitted", () => {
    const refine = vi.fn();
    useRangeMock.mockReturnValue({
      canRefine: true,
      range: { min: 1000, max: 120000 },
      start: [1000, undefined],
      refine,
    });

    render(<PriceRangeInput attribute="price_eur" />);
    fireEvent.change(screen.getByPlaceholderText("From"), { target: { value: "5000" } });
    fireEvent.change(screen.getByPlaceholderText("To"), { target: { value: "10000" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(refine).toHaveBeenCalledWith([5000, 10000]);
  });

  it("disables apply when the range cannot refine", () => {
    useRangeMock.mockReturnValue({
      canRefine: false,
      range: { min: undefined, max: undefined },
      start: [undefined, undefined],
      refine: vi.fn(),
    });

    render(<PriceRangeInput attribute="price_eur" />);
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });
});

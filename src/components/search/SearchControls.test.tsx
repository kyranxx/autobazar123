import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchPagination } from "./SearchControls";

const usePaginationMock = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "paginationHint") {
      return "Result pages";
    }
    return key;
  },
}));

vi.mock("react-instantsearch", () => ({
  Pagination: () => <div data-testid="stock-pagination" />,
  usePagination: (...args: unknown[]) => usePaginationMock(...args),
}));

describe("SearchPagination", () => {
  beforeEach(() => {
    usePaginationMock.mockReset();
  });

  it("hides pagination when there is only one result page", () => {
    usePaginationMock.mockReturnValue({
      nbPages: 1,
      pages: [0],
      currentRefinement: 0,
      isFirstPage: true,
      isLastPage: true,
      refine: vi.fn(),
    });

    const { container } = render(<SearchPagination />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders native buttons and refines when another page is selected", () => {
    const refine = vi.fn();
    usePaginationMock.mockReturnValue({
      nbPages: 3,
      pages: [0, 1, 2],
      currentRefinement: 1,
      isFirstPage: false,
      isLastPage: false,
      refine,
    });

    render(<SearchPagination />);

    fireEvent.click(screen.getByRole("button", { name: "Result pages: 3" }));

    expect(screen.queryByTestId("stock-pagination")).not.toBeInTheDocument();
    expect(refine).toHaveBeenCalledWith(2);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchSeoLinks from "./SearchSeoLinks";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "sk",
}));

describe("SearchSeoLinks", () => {
  it("does not hardcode city pSEO links before launch inventory qualifies them", () => {
    render(<SearchSeoLinks />);

    expect(screen.queryByRole("link", { name: "Bratislava" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Košice" })).not.toBeInTheDocument();
  });
});

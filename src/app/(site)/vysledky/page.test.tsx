import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import SearchPage from "./page";

vi.mock("@/components/theme/ThemePreviewShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./AlgoliaSearchPageClient", () => ({
  default: () => null,
}));

vi.mock("./SearchSeoLinks", () => ({
  default: () => null,
}));

describe("SearchPage", () => {
  it("renders a server-visible h1 for crawlers before the client search app loads", () => {
    render(<SearchPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Výsledky vyhľadávania áut na Slovensku",
      }),
    ).toBeInTheDocument();
  });
});

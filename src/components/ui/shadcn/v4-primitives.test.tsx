import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { badgeVariants } from "./badge";
import { Card, CardAction, CardHeader, CardTitle } from "./card";
import { tabsListVariants } from "./tabs";

describe("shadcn v4 primitive surface", () => {
  it("exports badge variants for composition", () => {
    expect(badgeVariants({ variant: "secondary" })).toContain("bg-secondary");
  });

  it("exports tabs list variants for composition", () => {
    expect(tabsListVariants({ variant: "line" })).toContain("bg-transparent");
  });

  it("renders CardAction with the expected slot", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardAction>Refresh</CardAction>
        </CardHeader>
      </Card>,
    );

    expect(screen.getByText("Refresh")).toHaveAttribute("data-slot", "card-action");
  });
});

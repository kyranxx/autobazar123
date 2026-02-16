import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("renders label and child content", () => {
    render(
      <FormField label="Email">
        <input aria-label="email-input" />
      </FormField>,
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("email-input")).toBeInTheDocument();
  });

  it("shows required asterisk when required", () => {
    render(
      <FormField label="Name" required>
        <input />
      </FormField>,
    );

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders error text", () => {
    render(
      <FormField label="Phone" error="Phone is invalid">
        <input />
      </FormField>,
    );

    expect(screen.getByText("Phone is invalid")).toBeInTheDocument();
  });
});

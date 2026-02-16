import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders label and generates deterministic id from label", () => {
    render(<Input label="E-mail adresa" />);

    const input = screen.getByLabelText("E-mail adresa");
    expect(input).toHaveAttribute("id", "field-e-mail-adresa");
    expect(input).toHaveAttribute("name", "field-e-mail-adresa");
  });

  it("uses provided id and name", () => {
    render(<Input id="custom-id" name="custom-name" label="Custom" />);

    const input = screen.getByLabelText("Custom");
    expect(input).toHaveAttribute("id", "custom-id");
    expect(input).toHaveAttribute("name", "custom-name");
  });

  it("falls back to placeholder token for name when no label/id/name exist", () => {
    render(<Input placeholder="Phone Number" />);

    const input = screen.getByPlaceholderText("Phone Number");
    expect(input).toHaveAttribute("name", "field-phone-number");
  });

  it("shows error message and aria error bindings", () => {
    render(<Input label="Email" error="Required field" />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "field-email-error");
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
  });

  it("shows hint when there is no error", () => {
    render(<Input label="Name" hint="Use your full name" />);

    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("aria-describedby", "field-name-hint");
    expect(screen.getByText("Use your full name")).toBeInTheDocument();
  });

  it("adds padding classes when icons are provided", () => {
    render(
      <Input
        label="Search"
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      />,
    );

    const input = screen.getByLabelText("Search");
    expect(input.className).toContain("pl-10");
    expect(input.className).toContain("pr-10");
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("forwards input events", () => {
    const onChange = vi.fn();
    render(<Input placeholder="Type here" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("Type here"), {
      target: { value: "hello" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

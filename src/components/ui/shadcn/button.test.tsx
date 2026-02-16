import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children and default data attributes", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it("applies variant and size attributes", () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("data-variant", "destructive");
    expect(button).toHaveAttribute("data-size", "sm");
  });

  it("fires click handler", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled prop", () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("sets loading state and hides icon props", () => {
    render(
      <Button
        loading
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      >
        Loading
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Loading" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("right-icon")).not.toBeInTheDocument();
    expect(button.querySelector(".animate-spin")).not.toBeNull();
  });

  it("renders left and right icons when not loading", () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      >
        Action
      </Button>,
    );

    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("marks non-loading button as not busy", () => {
    render(<Button>Idle</Button>);

    expect(screen.getByRole("button", { name: "Idle" })).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });
});

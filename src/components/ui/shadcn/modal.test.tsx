import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./modal";

describe("Modal", () => {
  it("uses DialogClose for custom close icon actions", () => {
    const onClose = vi.fn();

    render(
      <Modal
        open
        onClose={onClose}
        title="Details"
        description="Helpful context"
        closeIcon={<span data-testid="close-icon">x</span>}
      >
        <p>Body</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));

    expect(screen.getByTestId("close-icon")).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

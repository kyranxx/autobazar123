import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModerationEmailPreference } from "./ModerationEmailPreference";

const {
  mockRefreshProfile,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockRefreshProfile: vi.fn().mockResolvedValue(undefined),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ro",
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    profile: { notify_moderation_email: true },
    refreshProfile: mockRefreshProfile,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

describe("ModerationEmailPreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows translated Romanian success feedback for a saved setting", async () => {
    render(<ModerationEmailPreference />);

    fireEvent.click(document.querySelector("input[type=checkbox]")!);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Preferința a fost salvată.",
      );
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("shows translated Romanian error feedback and restores the setting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    render(<ModerationEmailPreference />);
    const checkbox = document.querySelector("input[type=checkbox]") as HTMLInputElement;
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Preferința de e-mail nu a putut fi salvată.",
      );
    });
    expect(checkbox.checked).toBe(true);
  });
});

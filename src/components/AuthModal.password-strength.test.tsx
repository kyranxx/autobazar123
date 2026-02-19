import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthModal from "./AuthModal";

const {
  mockRouterRefresh,
  mockSignInWithPassword,
  mockSignInWithOAuth,
  mockSignUp,
  mockResend,
  mockResetPasswordForEmail,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  mockRouterRefresh: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockSignUp: vi.fn(),
  mockResend: vi.fn(),
  mockResetPasswordForEmail: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signUp: mockSignUp,
      resend: mockResend,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

describe("AuthModal register password strength", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows weak strength for short simple password", async () => {
    render(<AuthModal isOpen onClose={vi.fn()} initialView="register" />);

    const passwordInput = document.getElementById(
      "auth-register-password",
    ) as HTMLInputElement | null;
    expect(passwordInput).not.toBeNull();

    fireEvent.change(passwordInput!, { target: { value: "abc" } });

    await waitFor(() => {
      const label = document.querySelector(
        '[data-testid="register-password-strength-label"]',
      );
      expect(label?.textContent).toBe("Slaba");
    });

    const bar = document.querySelector(
      '[data-testid="register-password-strength-bar"]',
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar!.style.width).toBe("33%");
  });

  it("shows medium strength when password has letters, numbers, and length", async () => {
    render(<AuthModal isOpen onClose={vi.fn()} initialView="register" />);

    const passwordInput = document.getElementById(
      "auth-register-password",
    ) as HTMLInputElement | null;
    expect(passwordInput).not.toBeNull();

    fireEvent.change(passwordInput!, { target: { value: "abc1234" } });

    await waitFor(() => {
      const label = document.querySelector(
        '[data-testid="register-password-strength-label"]',
      );
      expect(label?.textContent).toBe("Stredna");
    });

    const bar = document.querySelector(
      '[data-testid="register-password-strength-bar"]',
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar!.style.width).toBe("66%");
  });

  it("shows strong strength when password is long and includes symbols", async () => {
    render(<AuthModal isOpen onClose={vi.fn()} initialView="register" />);

    const passwordInput = document.getElementById(
      "auth-register-password",
    ) as HTMLInputElement | null;
    expect(passwordInput).not.toBeNull();

    fireEvent.change(passwordInput!, { target: { value: "Strong!1234" } });

    await waitFor(() => {
      const label = document.querySelector(
        '[data-testid="register-password-strength-label"]',
      );
      expect(label?.textContent).toBe("Silna");
    });

    const bar = document.querySelector(
      '[data-testid="register-password-strength-bar"]',
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar!.style.width).toBe("100%");
  });

  it("shows password match feedback and unlocks submit only when register form is valid", async () => {
    render(<AuthModal isOpen onClose={vi.fn()} initialView="register" />);

    const fullNameInput = document.getElementById(
      "auth-register-full-name",
    ) as HTMLInputElement | null;
    const emailInput = document.getElementById(
      "auth-register-email",
    ) as HTMLInputElement | null;
    const passwordInput = document.getElementById(
      "auth-register-password",
    ) as HTMLInputElement | null;
    const confirmPasswordInput = document.getElementById(
      "auth-register-confirm-password",
    ) as HTMLInputElement | null;
    const termsCheckbox = document.getElementById(
      "auth-register-terms",
    ) as HTMLInputElement | null;

    expect(fullNameInput).not.toBeNull();
    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(confirmPasswordInput).not.toBeNull();
    expect(termsCheckbox).not.toBeNull();

    fireEvent.change(fullNameInput!, { target: { value: "Test User" } });
    fireEvent.change(emailInput!, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput!, { target: { value: "abc1234" } });
    fireEvent.change(confirmPasswordInput!, { target: { value: "abc12345" } });
    fireEvent.click(termsCheckbox!);

    await waitFor(() => {
      const match = document.querySelector('[data-testid="register-password-match"]');
      expect(match?.textContent).toBe("Hesla sa nezhoduju");
    });

    const submitButton = document.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(submitButton).not.toBeNull();
    expect(submitButton?.disabled).toBe(true);

    fireEvent.change(confirmPasswordInput!, { target: { value: "abc1234" } });

    await waitFor(() => {
      const match = document.querySelector('[data-testid="register-password-match"]');
      expect(match?.textContent).toBe("Hesla sa zhoduju");
    });

    expect(submitButton?.disabled).toBe(false);
  });
});

import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import skMessages from "@/i18n/messages/sk.json";
import {
  fillRegisterForm,
  getRegisterFormElements,
  renderAuthModal,
} from "./AuthModal.test-helpers";

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
    renderAuthModal({ isOpen: true, onClose: vi.fn(), initialView: "register" });

    const { passwordInput } = getRegisterFormElements();
    expect(passwordInput).not.toBeNull();

    fireEvent.change(passwordInput!, { target: { value: "abc" } });

    await waitFor(() => {
      const label = document.querySelector(
        '[data-testid="register-password-strength-label"]',
      );
      expect(label?.textContent).toBe(skMessages.authModal.passwordStrength.weak);
    });

    const bar = document.querySelector(
      '[data-testid="register-password-strength-bar"]',
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar!.style.width).toBe("33%");
  });

  it("shows medium strength when password has letters, numbers, and length", async () => {
    renderAuthModal({ isOpen: true, onClose: vi.fn(), initialView: "register" });

    const { passwordInput } = getRegisterFormElements();
    expect(passwordInput).not.toBeNull();

    fireEvent.change(passwordInput!, { target: { value: "abc1234" } });

    await waitFor(() => {
      const label = document.querySelector(
        '[data-testid="register-password-strength-label"]',
      );
      expect(label?.textContent).toBe(skMessages.authModal.passwordStrength.medium);
    });

    const bar = document.querySelector(
      '[data-testid="register-password-strength-bar"]',
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar!.style.width).toBe("66%");
  });

  it("shows strong strength when password is long and includes symbols", async () => {
    renderAuthModal({ isOpen: true, onClose: vi.fn(), initialView: "register" });

    const { passwordInput } = getRegisterFormElements();
    expect(passwordInput).not.toBeNull();

    fireEvent.change(passwordInput!, { target: { value: "Strong!1234" } });

    await waitFor(() => {
      const label = document.querySelector(
        '[data-testid="register-password-strength-label"]',
      );
      expect(label?.textContent).toBe(skMessages.authModal.passwordStrength.strong);
    });

    const bar = document.querySelector(
      '[data-testid="register-password-strength-bar"]',
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar!.style.width).toBe("100%");
  });

  it("shows password match feedback and unlocks submit only when register form is valid", async () => {
    renderAuthModal({ isOpen: true, onClose: vi.fn(), initialView: "register" });

    const {
      fullNameInput,
      emailInput,
      passwordInput,
      confirmPasswordInput,
      termsCheckbox,
    } = fillRegisterForm({
      password: "abc1234567",
      confirmPassword: "abc12345678",
    });

    expect(fullNameInput).not.toBeNull();
    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(confirmPasswordInput).not.toBeNull();
    expect(termsCheckbox).not.toBeNull();

    await waitFor(() => {
      const match = document.querySelector('[data-testid="register-password-match"]');
      expect(match?.textContent).toBe(skMessages.authModal.register.passwordsDoNotMatch);
    });

    const submitButton = document.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(submitButton).not.toBeNull();
    expect(submitButton?.disabled).toBe(true);

    fireEvent.change(confirmPasswordInput!, { target: { value: "abc1234567" } });

    await waitFor(() => {
      const match = document.querySelector('[data-testid="register-password-match"]');
      expect(match?.textContent).toBe(skMessages.authModal.register.passwordsMatch);
    });

    expect(submitButton?.disabled).toBe(false);
  });
});

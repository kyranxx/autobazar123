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

describe("AuthModal auth email flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({
      error: null,
      data: { user: { identities: [{ id: "identity-1" }] } },
    });
    mockResend.mockResolvedValue({ error: null });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("triggers Supabase signUp with auth callback redirect during registration", async () => {
    const onClose = vi.fn();

    render(<AuthModal isOpen onClose={onClose} initialView="register" />);

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
    fireEvent.change(passwordInput!, { target: { value: "secret123" } });
    fireEvent.change(confirmPasswordInput!, {
      target: { value: "secret123" },
    });
    fireEvent.click(termsCheckbox!);

    const form = fullNameInput!.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "secret123",
      options: {
        data: { full_name: "Test User" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalled();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-testid="register-verify-view"]'),
    ).not.toBeNull();
  });

  it("triggers Supabase resetPasswordForEmail with reset-password redirect", async () => {
    const onClose = vi.fn();

    render(<AuthModal isOpen onClose={onClose} initialView="reset" />);

    const emailInput = document.getElementById(
      "auth-reset-email",
    ) as HTMLInputElement | null;
    expect(emailInput).not.toBeNull();

    fireEvent.change(emailInput!, { target: { value: "reset@example.com" } });

    const form = emailInput!.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
    });

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "reset@example.com",
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      },
    );

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalled();
    });
  });

  it("resends confirmation email from verify step with signup redirect", async () => {
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

    fireEvent.change(fullNameInput!, { target: { value: "Test User" } });
    fireEvent.change(emailInput!, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput!, { target: { value: "secret123" } });
    fireEvent.change(confirmPasswordInput!, {
      target: { value: "secret123" },
    });
    fireEvent.click(termsCheckbox!);

    const registerForm = fullNameInput!.closest("form");
    expect(registerForm).not.toBeNull();
    fireEvent.submit(registerForm!);

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="register-verify-view"]'),
      ).not.toBeNull();
    });

    const resendButton = document.querySelector(
      '[data-testid="resend-confirmation-button"]',
    ) as HTMLButtonElement | null;
    expect(resendButton).not.toBeNull();

    fireEvent.click(resendButton!);

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledTimes(1);
    });

    expect(mockResend).toHaveBeenCalledWith({
      type: "signup",
      email: "test@example.com",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  });

  it("shows explicit message and returns to login when Supabase signals existing account", async () => {
    mockSignUp.mockResolvedValueOnce({
      error: null,
      data: { user: { identities: [] } },
    });

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

    fireEvent.change(fullNameInput!, { target: { value: "Test User" } });
    fireEvent.change(emailInput!, { target: { value: "known@example.com" } });
    fireEvent.change(passwordInput!, { target: { value: "secret123" } });
    fireEvent.change(confirmPasswordInput!, {
      target: { value: "secret123" },
    });
    fireEvent.click(termsCheckbox!);

    const registerForm = fullNameInput!.closest("form");
    expect(registerForm).not.toBeNull();
    fireEvent.submit(registerForm!);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Email je uz registrovany. Prihlaste sa alebo obnovte heslo.",
      );
    });

    expect(document.getElementById("auth-login-email")).not.toBeNull();
  });
});

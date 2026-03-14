import { fireEvent, render, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import AuthModal from "./AuthModal";
import skMessages from "@/i18n/messages/sk.json";

const {
  mockRouterRefresh,
  mockSignInWithPassword,
  mockSignInWithOAuth,
  mockFetch,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  mockRouterRefresh: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockFetch: vi.fn(),
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
  const renderModal = (props: ComponentProps<typeof AuthModal>) =>
    render(
      <NextIntlClientProvider locale="sk" messages={skMessages}>
        <AuthModal {...props} />
      </NextIntlClientProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockImplementation(async (input: string | URL | Request) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (url.endsWith("/api/auth/register")) {
        return new Response(
          JSON.stringify({ ok: true, alreadyRegistered: false }),
          { status: 200 },
        );
      }

      if (url.endsWith("/api/auth/register/resend")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url.endsWith("/api/auth/password-reset")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "Unknown endpoint" }), {
        status: 404,
      });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls register API and transitions to verify state during registration", async () => {
    const onClose = vi.fn();

    renderModal({ isOpen: true, onClose, initialView: "register" });

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
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const registerCall = mockFetch.mock.calls[0];
    expect(registerCall?.[0]).toBe("/api/auth/register");
    expect(registerCall?.[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(registerCall?.[1]?.body).toBe(
      JSON.stringify({
        email: "test@example.com",
        password: "secret123",
        fullName: "Test User",
        dealerInterest: false,
      }),
    );

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalled();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-testid="register-verify-view"]'),
    ).not.toBeNull();
  });

  it("calls password-reset API during reset flow", async () => {
    const onClose = vi.fn();

    renderModal({ isOpen: true, onClose, initialView: "reset" });

    const emailInput = document.getElementById(
      "auth-reset-email",
    ) as HTMLInputElement | null;
    expect(emailInput).not.toBeNull();

    fireEvent.change(emailInput!, { target: { value: "reset@example.com" } });

    const form = emailInput!.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const resetCall = mockFetch.mock.calls[0];
    expect(resetCall?.[0]).toBe("/api/auth/password-reset");
    expect(resetCall?.[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(resetCall?.[1]?.body).toBe(
      JSON.stringify({
        email: "reset@example.com",
      }),
    );

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalled();
    });
  });

  it("resends confirmation email from verify step through API", async () => {
    renderModal({ isOpen: true, onClose: vi.fn(), initialView: "register" });

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
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    const resendCall = mockFetch.mock.calls[1];
    expect(resendCall?.[0]).toBe("/api/auth/register/resend");
    expect(resendCall?.[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(resendCall?.[1]?.body).toBe(
      JSON.stringify({
        email: "test@example.com",
      }),
    );
  });

  it("shows explicit message and returns to login when API signals existing account", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, alreadyRegistered: true }), {
        status: 200,
      }),
    );

    renderModal({ isOpen: true, onClose: vi.fn(), initialView: "register" });

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
        skMessages.authModal.errors.alreadyRegistered,
      );
    });

    expect(document.getElementById("auth-login-email")).not.toBeNull();
  });

  it("starts Google OAuth with localhost callback URL", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: { message: "oauth failed" },
    });

    renderModal({ isOpen: true, onClose: vi.fn(), initialView: "login" });

    const googleButton =
      Array.from(document.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Google"),
      ) ?? null;
    expect(googleButton).not.toBeNull();

    fireEvent.click(googleButton!);

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
        skipBrowserRedirect: true,
      },
    });
  });

  it("blocks redirect when provider callback URL points to production", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: {
        url: "https://auth.autobazar123.test/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fautobazar123.sk%2Fauth%2Fcallback",
      },
      error: null,
    });

    renderModal({ isOpen: true, onClose: vi.fn(), initialView: "login" });

    const googleButton =
      Array.from(document.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Google"),
      ) ?? null;
    expect(googleButton).not.toBeNull();

    fireEvent.click(googleButton!);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        skMessages.authModal.errors.oauthRedirectMismatch.replace(
          "{redirectTo}",
          "http://localhost:3000/auth/callback",
        ),
      );
    });
  });
});

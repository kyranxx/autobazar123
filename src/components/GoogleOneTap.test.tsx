import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoogleOneTap from "./GoogleOneTap";

const { mockRefresh, mockGenerateNonce, mockSignInWithIdToken } =
  vi.hoisted(() => ({
    mockRefresh: vi.fn(),
    mockGenerateNonce: vi.fn(),
    mockSignInWithIdToken: vi.fn(),
  }));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/lib/auth/google-one-tap-nonce", () => ({
  generateGoogleOneTapNonce: mockGenerateNonce,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithIdToken: mockSignInWithIdToken,
    },
  }),
}));

describe("GoogleOneTap", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    const testWindow = Object.create(window) as Window;
    Object.defineProperty(testWindow, "location", {
      configurable: true,
      value: {
        hostname: "www.autoninja.sk",
        protocol: "https:",
      },
    });
    vi.stubGlobal("window", testWindow);
    delete (window as { google?: unknown }).google;
    mockRefresh.mockReset();
    mockGenerateNonce.mockResolvedValue({
      hashedNonce: "hashed-nonce",
      nonce: "raw-nonce",
    });
    mockSignInWithIdToken.mockResolvedValue({ error: null });
    Object.defineProperty(navigator, "webdriver", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    cleanup();
    delete (window as { google?: unknown }).google;
    vi.unstubAllGlobals();
  });

  it("loads, initializes, and prompts Google One Tap with the verified nonce", async () => {
    const initialize = vi.fn();
    const prompt = vi.fn();
    (window as unknown as { google?: unknown }).google = {
      accounts: {
        id: {
          initialize,
          prompt,
          cancel: vi.fn(),
        },
      },
    };

    render(<GoogleOneTap clientId="client-id" enabled marketCode="SK" />);

    const script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    expect(script).not.toBeNull();

    await act(async () => {
      script?.dispatchEvent(new Event("load"));
    });

    await waitFor(() => {
      expect(initialize).toHaveBeenCalledWith({
        client_id: "client-id",
        callback: expect.any(Function),
        auto_select: false,
        cancel_on_tap_outside: false,
        itp_support: true,
        nonce: "hashed-nonce",
      });
      expect(prompt).toHaveBeenCalledTimes(1);
    });

    const callback = initialize.mock.calls[0]?.[0]?.callback as
      | ((response: { credential: string }) => Promise<void>)
      | undefined;
    expect(callback).toBeTypeOf("function");

    await act(async () => {
      await callback?.({ credential: "google-id-token" });
    });

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: "google-id-token",
      nonce: "raw-nonce",
    });
  });

  it("does not load the Google client when the feature is disabled", () => {
    render(
      <GoogleOneTap clientId="client-id" enabled={false} marketCode="SK" />,
    );

    expect(
      document.querySelector('script[src="https://accounts.google.com/gsi/client"]'),
    ).toBeNull();
  });

  it("does not initialize a market client on a different market origin", () => {
    const initialize = vi.fn();
    (window as unknown as { google?: unknown }).google = {
      accounts: {
        id: {
          initialize,
          prompt: vi.fn(),
          cancel: vi.fn(),
        },
      },
    };

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        hostname: "www.autoninja.ro",
        protocol: "https:",
      },
    });

    render(<GoogleOneTap clientId="sk-client-id" enabled marketCode="SK" />);

    expect(
      document.querySelector('script[src="https://accounts.google.com/gsi/client"]'),
    ).toBeNull();
    expect(initialize).not.toHaveBeenCalled();
  });
});

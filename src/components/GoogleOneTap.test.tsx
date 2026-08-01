import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoogleOneTap from "./GoogleOneTap";

const { mockRefresh, mockGenerateNonce } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockGenerateNonce: vi.fn(),
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

    render(<GoogleOneTap clientId="client-id" enabled />);

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
  });

  it("does not load the Google client when the feature is disabled", () => {
    render(<GoogleOneTap clientId="client-id" enabled={false} />);

    expect(
      document.querySelector('script[src="https://accounts.google.com/gsi/client"]'),
    ).toBeNull();
  });
});

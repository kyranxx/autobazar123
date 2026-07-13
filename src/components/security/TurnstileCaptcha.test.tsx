import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TurnstileCaptcha from "./TurnstileCaptcha";

const { useLocaleMock } = vi.hoisted(() => ({
  useLocaleMock: vi.fn(() => "sk"),
}));

vi.mock("next-intl", () => ({
  useLocale: () => useLocaleMock(),
}));

describe("TurnstileCaptcha", () => {
  beforeEach(() => {
    useLocaleMock.mockReturnValue("sk");
    delete window.__autobazarTurnstileLoader;
    window.turnstile = {
      render: vi.fn((_target: HTMLElement, _options) => "test-widget-id"),
      remove: vi.fn((_widgetId: string) => undefined),
    };
  });

  afterEach(() => {
    cleanup();
    delete window.turnstile;
    delete window.__autobazarTurnstileLoader;
    document.head.innerHTML = "";
  });

  it("does not remount when only the token handler identity changes", async () => {
    const firstTokenChange = vi.fn();
    const secondTokenChange = vi.fn();

    const { rerender } = render(
      <TurnstileCaptcha
        onTokenChange={firstTokenChange}
        action="inquiry_submit"
      />,
    );

    await waitFor(() => {
      expect(window.turnstile?.render).toHaveBeenCalledTimes(1);
    });

    rerender(
      <TurnstileCaptcha
        onTokenChange={secondTokenChange}
        action="inquiry_submit"
      />,
    );

    expect(window.turnstile?.remove).not.toHaveBeenCalled();
    expect(window.turnstile?.render).toHaveBeenCalledTimes(1);
  });

  it("shows Romanian captcha failure copy on Romanian market pages", async () => {
    useLocaleMock.mockReturnValue("ro");
    const onTokenChange = vi.fn();

    render(<TurnstileCaptcha onTokenChange={onTokenChange} />);

    await waitFor(() => {
      expect(window.turnstile?.render).toHaveBeenCalledTimes(1);
    });

    const renderOptions = vi.mocked(window.turnstile!.render).mock.calls[0]?.[1];
    expect(renderOptions).toBeDefined();

    act(() => {
      renderOptions?.["expired-callback"]?.();
    });

    expect(screen.getByText("Captcha a expirat. Confirmă captcha din nou.")).toBeInTheDocument();
    expect(onTokenChange).toHaveBeenLastCalledWith(null);
  });
});

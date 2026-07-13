import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WebVitalsReporter from "./WebVitalsReporter";

const { usePathnameMock, useReportWebVitalsMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  useReportWebVitalsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("next/web-vitals", () => ({
  useReportWebVitals: useReportWebVitalsMock,
}));

describe("WebVitalsReporter", () => {
  const originalEnableWebVitals = process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS;
  const sendBeaconMock = vi.fn();

  beforeEach(() => {
    usePathnameMock.mockReturnValue("/");
    useReportWebVitalsMock.mockClear();
    sendBeaconMock.mockClear();
    process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS = "true";
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeaconMock,
    });
  });

  afterEach(() => {
    cleanup();
    if (originalEnableWebVitals === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS = originalEnableWebVitals;
    }
  });

  it("keeps one stable web-vitals callback while reporting the latest route", async () => {
    const { rerender } = render(<WebVitalsReporter />);

    expect(useReportWebVitalsMock).toHaveBeenCalledTimes(1);
    const reportCallback = useReportWebVitalsMock.mock.calls[0][0];

    usePathnameMock.mockReturnValue("/vysledky");
    rerender(<WebVitalsReporter />);

    expect(useReportWebVitalsMock).toHaveBeenCalledTimes(2);
    expect(useReportWebVitalsMock.mock.calls[1][0]).toBe(reportCallback);

    reportCallback({
      id: "metric-stable-callback",
      name: "LCP",
      value: 1250,
      delta: 1250,
      rating: "good",
      navigationType: "navigate",
    });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const body = sendBeaconMock.mock.calls[0][1] as Blob;
    await expect(body.text()).resolves.toContain('"route":"/vysledky"');
  });

  it("bounds remembered metric keys during long browser sessions", () => {
    render(<WebVitalsReporter />);

    const reportCallback = useReportWebVitalsMock.mock.calls[0][0];
    sendBeaconMock.mockClear();

    for (let index = 0; index < 252; index += 1) {
      reportCallback({
        id: `metric-cache-${index}`,
        name: "LCP",
        value: 1000 + index,
        delta: 1000 + index,
        rating: "good",
        navigationType: "navigate",
      });
    }

    reportCallback({
      id: "metric-cache-0",
      name: "LCP",
      value: 2000,
      delta: 2000,
      rating: "good",
      navigationType: "navigate",
    });

    expect(sendBeaconMock).toHaveBeenCalledTimes(253);
  });
});

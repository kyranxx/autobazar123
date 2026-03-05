import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type RGB = [number, number, number];

const WHITE = "#ffffff";
const GLOBAL_CSS = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");

function parseHex(hex: string): RGB {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    throw new Error(`Expected 6-digit hex color, got "${hex}"`);
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function toLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: RGB): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(foreground: string, background: string): number {
  const fg = luminance(parseHex(foreground));
  const bg = luminance(parseHex(background));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function blendOver(foreground: string, background: string, alpha: number): string {
  const [fr, fg, fb] = parseHex(foreground);
  const [br, bg, bb] = parseHex(background);

  const mixed = [
    Math.round(fr * alpha + br * (1 - alpha)),
    Math.round(fg * alpha + bg * (1 - alpha)),
    Math.round(fb * alpha + bb * (1 - alpha)),
  ] as RGB;

  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function getHexToken(tokenName: string): string {
  const escapedToken = tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = GLOBAL_CSS.match(new RegExp(`${escapedToken}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`));

  if (!match) {
    throw new Error(`Unable to resolve token "${tokenName}" from src/app/globals.css`);
  }

  return match[1].toLowerCase();
}

describe("theme token contrast guardrails", () => {
  it("keeps accent token accessible on white surfaces and buttons", () => {
    const accent = getHexToken("--color-accent");

    expect(contrastRatio(accent, WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(WHITE, accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps white text readable on top-banner glass chips", () => {
    const accent = getHexToken("--color-accent");
    const chipBackground = blendOver(WHITE, accent, 0.15);

    expect(contrastRatio(WHITE, chipBackground)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps success token readable on light surfaces", () => {
    const success = getHexToken("--color-success");
    const successSubtle = getHexToken("--color-success-subtle");

    expect(contrastRatio(success, WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(success, successSubtle)).toBeGreaterThanOrEqual(4.5);
  });
});

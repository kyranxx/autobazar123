import { describe, expect, it } from "vitest";
import {
  ACTION_COSTS,
  CREDIT_PACKS,
  canAffordAction,
  getAffordableActions,
  getFeaturedPack,
  getPricePerCredit,
} from "./credits";

describe("credit configuration helpers", () => {
  it("calculates price per credit with rounding", () => {
    const pack = CREDIT_PACKS.find((entry) => entry.id === "seller");
    expect(pack).toBeDefined();
    expect(getPricePerCredit(pack!)).toBe(0.8);
  });

  it("returns 0 affordable actions when action does not exist", () => {
    expect(getAffordableActions(20, "missing")).toBe(0);
  });

  it("returns number of affordable actions based on balance", () => {
    expect(getAffordableActions(5, "publish")).toBe(5);
    expect(getAffordableActions(5, "top")).toBe(1);
  });

  it("returns false for unknown action affordability checks", () => {
    expect(canAffordAction(50, "missing")).toBe(false);
  });

  it("checks affordability for single action", () => {
    expect(canAffordAction(3, "top")).toBe(true);
    expect(canAffordAction(2, "top")).toBe(false);
  });

  it("checks affordability with quantity multiplier", () => {
    expect(canAffordAction(6, "highlight", 3)).toBe(true);
    expect(canAffordAction(5, "highlight", 3)).toBe(false);
  });

  it("returns the featured pack", () => {
    const featured = getFeaturedPack();
    expect(featured?.id).toBe("seller");
  });

  it("has positive credit costs configured for every action", () => {
    expect(ACTION_COSTS.every((action) => action.credits > 0)).toBe(true);
  });
});

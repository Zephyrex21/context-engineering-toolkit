import { describe, it, expect } from "vitest";
import { estimateCost, getPricingTable } from "../services/pricing.js";

describe("estimateCost", () => {
  it("computes a correct estimate against the known Gemini Flash-Lite rate", () => {
    // Published rate: $0.10/1M input, $0.40/1M output
    const cost = estimateCost("gemini-2.5-flash-lite", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.1 + 0.4, 6);
  });

  it("returns null for an unknown model instead of guessing", () => {
    expect(estimateCost("not-a-real-model", 1000, 1000)).toBeNull();
  });

  it("zero tokens costs zero", () => {
    expect(estimateCost("gemini-2.5-flash-lite", 0, 0)).toBe(0);
  });

  it("every model in the pricing table has both input and output rates defined", () => {
    const table = getPricingTable();
    for (const [model, rates] of Object.entries(table)) {
      expect(rates.input, `${model} missing input rate`).toBeGreaterThan(0);
      expect(rates.output, `${model} missing output rate`).toBeGreaterThan(0);
    }
  });

  it("output tokens are consistently priced higher than input tokens (true for every model here)", () => {
    const table = getPricingTable();
    for (const [model, rates] of Object.entries(table)) {
      expect(rates.output, `${model} output should cost more than input per token`).toBeGreaterThanOrEqual(rates.input);
    }
  });
});

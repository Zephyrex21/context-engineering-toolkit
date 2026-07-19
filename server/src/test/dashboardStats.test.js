import { describe, it, expect } from "vitest";
import { computeDashboardStats } from "../services/dashboardStats.js";

describe("computeDashboardStats", () => {
  it("empty array returns zeroed stats, not NaN or crashes", () => {
    const stats = computeDashboardStats([]);
    expect(stats.totalRuns).toBe(0);
    expect(stats.totalTokensSaved).toBe(0);
    expect(stats.avgMeaningPreserved).toBeNull();
    expect(stats.timeline).toEqual([]);
  });

  it("computes correct totals and averages across multiple runs", () => {
    const runs = [
      { originalTokens: 200, finalTokens: 50, overallReductionPercent: 75, meaningPreserved: 0.8, costSaved: 0.0001, evaluateRan: true, timestamp: "2026-07-01" },
      { originalTokens: 100, finalTokens: 40, overallReductionPercent: 60, meaningPreserved: 0.6, costSaved: 0.00005, evaluateRan: false, timestamp: "2026-07-03" },
    ];
    const stats = computeDashboardStats(runs);
    expect(stats.totalRuns).toBe(2);
    expect(stats.totalTokensSaved).toBe(150 + 60);
    expect(stats.avgReductionPercent).toBeCloseTo(67.5, 1);
    expect(stats.avgMeaningPreserved).toBeCloseTo(0.7, 3);
    expect(stats.evaluateRunRate).toBeCloseTo(50, 1);
  });

  it("excludes null meaningPreserved values from the average instead of treating them as 0", () => {
    const runs = [
      { originalTokens: 100, finalTokens: 50, overallReductionPercent: 50, meaningPreserved: 1.0, costSaved: 0, evaluateRan: false, timestamp: "2026-01-01" },
      { originalTokens: 100, finalTokens: 50, overallReductionPercent: 50, meaningPreserved: null, costSaved: 0, evaluateRan: false, timestamp: "2026-01-02" },
    ];
    const stats = computeDashboardStats(runs);
    // If null were treated as 0, this would average to 0.5. It should be 1.0.
    expect(stats.avgMeaningPreserved).toBe(1.0);
  });

  it("clamps a negative token delta to 0 instead of letting it go negative", () => {
    const runs = [
      { originalTokens: 50, finalTokens: 80, overallReductionPercent: -60, meaningPreserved: 0.5, costSaved: 0, evaluateRan: false, timestamp: "2026-01-01" },
    ];
    const stats = computeDashboardStats(runs);
    expect(stats.totalTokensSaved).toBe(0);
  });

  it("timeline is sorted chronologically regardless of input order", () => {
    const runs = [
      { originalTokens: 100, finalTokens: 50, overallReductionPercent: 50, meaningPreserved: 0.5, costSaved: 0, evaluateRan: false, timestamp: "2026-07-03" },
      { originalTokens: 100, finalTokens: 50, overallReductionPercent: 50, meaningPreserved: 0.5, costSaved: 0, evaluateRan: false, timestamp: "2026-07-01" },
      { originalTokens: 100, finalTokens: 50, overallReductionPercent: 50, meaningPreserved: 0.5, costSaved: 0, evaluateRan: false, timestamp: "2026-07-02" },
    ];
    const stats = computeDashboardStats(runs);
    expect(stats.timeline.map((t) => t.timestamp)).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
  });

  it("handles incomplete/malformed records defensively without crashing", () => {
    const stats = computeDashboardStats([{ timestamp: "2026-01-01" }]);
    expect(stats.totalTokensSaved).toBe(0);
    expect(stats.avgMeaningPreserved).toBeNull();
  });
});

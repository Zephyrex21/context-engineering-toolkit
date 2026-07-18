/**
 * Pure function: takes an array of plain run records, returns aggregate
 * stats. Deliberately has zero Mongo/DB dependency so it can be tested with
 * synthetic data — the actual read from Mongo is a thin, low-risk call to
 * .find().sort().limit() elsewhere; this is where the actual logic (and
 * actual bug risk) lives.
 */
export function computeDashboardStats(runs) {
  if (!runs || runs.length === 0) {
    return {
      totalRuns: 0,
      totalTokensSaved: 0,
      avgReductionPercent: 0,
      avgMeaningPreserved: null,
      totalCostSaved: 0,
      evaluateRunRate: 0,
      timeline: [],
    };
  }

  const totalRuns = runs.length;

  const totalTokensSaved = runs.reduce(
    (sum, r) => sum + Math.max((r.originalTokens ?? 0) - (r.finalTokens ?? 0), 0),
    0
  );

  const avgReductionPercent =
    Math.round(
      (runs.reduce((sum, r) => sum + (r.overallReductionPercent ?? 0), 0) / totalRuns) * 10
    ) / 10;

  const meaningScores = runs
    .map((r) => r.meaningPreserved)
    .filter((v) => v !== null && v !== undefined);
  const avgMeaningPreserved = meaningScores.length
    ? Math.round((meaningScores.reduce((a, b) => a + b, 0) / meaningScores.length) * 1000) / 1000
    : null;

  const totalCostSaved = Math.round(
    runs.reduce((sum, r) => sum + (r.costSaved ?? 0), 0) * 1_000_000
  ) / 1_000_000;

  const evaluateRunRate =
    Math.round((runs.filter((r) => r.evaluateRan).length / totalRuns) * 1000) / 10;

  const timeline = runs
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((r) => ({
      timestamp: r.timestamp,
      tokensSaved: Math.max((r.originalTokens ?? 0) - (r.finalTokens ?? 0), 0),
      reductionPercent: r.overallReductionPercent ?? 0,
    }));

  return {
    totalRuns,
    totalTokensSaved,
    avgReductionPercent,
    avgMeaningPreserved,
    totalCostSaved,
    evaluateRunRate,
    timeline,
  };
}

import { Router } from "express";
import { isMongoReady } from "../db/mongo.js";
import { fetchRecentRuns } from "../db/pipelineRuns.js";
import { computeDashboardStats } from "../services/dashboardStats.js";

export const dashboardRouter = Router();

// Demo-scale cap on how many historical runs feed the aggregate stats.
const STATS_SAMPLE_SIZE = 500;

dashboardRouter.get("/stats", async (req, res) => {
  if (!isMongoReady()) {
    return res.json({ available: false, ...computeDashboardStats([]) });
  }
  try {
    const runs = await fetchRecentRuns(STATS_SAMPLE_SIZE);
    res.json({ available: true, ...computeDashboardStats(runs) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard stats." });
  }
});

dashboardRouter.get("/runs", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  if (!isMongoReady()) {
    return res.json({ available: false, runs: [] });
  }
  try {
    const runs = await fetchRecentRuns(limit);
    res.json({ available: true, runs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load runs." });
  }
});

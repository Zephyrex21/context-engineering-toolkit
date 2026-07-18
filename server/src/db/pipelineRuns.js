import mongoose from "mongoose";
import { isMongoReady } from "./mongo.js";

const pipelineRunSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  query: String,
  originalTokens: Number,
  finalTokens: Number,
  overallReductionPercent: Number,
  meaningPreserved: Number,
  embeddingMode: String,
  summarizeTriggered: Boolean,
  summarizeUsed: Boolean,
  evaluateRan: Boolean,
  evaluateScoringMethod: String,
  costSaved: Number,
});

// mongoose.models check avoids "OverwriteModelError" if this module is
// ever re-imported within the same process (e.g. in tests).
const PipelineRun = mongoose.models.PipelineRun || mongoose.model("PipelineRun", pipelineRunSchema);

/**
 * Saves one pipeline run for the dashboard. Deliberately never throws in a
 * way that could break the caller — persistence is a nice-to-have layered
 * on top of a pipeline run that already succeeded, not a dependency of it.
 */
export async function savePipelineRun(pipelineResult, query) {
  if (!isMongoReady()) return null;

  const evaluate = pipelineResult.stages.evaluate;
  const summarize = pipelineResult.stages.summarize;

  const doc = new PipelineRun({
    query: typeof query === "string" ? query.slice(0, 300) : "",
    originalTokens: pipelineResult.originalTokens,
    finalTokens: pipelineResult.finalTokens,
    overallReductionPercent: pipelineResult.overallReductionPercent,
    meaningPreserved: pipelineResult.finalMeaningPreserved,
    embeddingMode: pipelineResult.stages.select.embeddingMode,
    summarizeTriggered: Boolean(summarize?.triggered),
    summarizeUsed: Boolean(summarize?.used),
    evaluateRan: !evaluate?.skipped,
    evaluateScoringMethod: evaluate?.scoring?.method ?? null,
    costSaved: evaluate?.costSaved ?? null,
  });

  return doc.save();
}

export async function fetchRecentRuns(limit = 50) {
  if (!isMongoReady()) return [];
  return PipelineRun.find().sort({ timestamp: -1 }).limit(limit).lean();
}

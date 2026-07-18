import { Router } from "express";
import { runPipeline } from "../services/pipeline.js";
import { savePipelineRun } from "../db/pipelineRuns.js";

export const pipelineRouter = Router();

const MAX_CHARS = 100_000;

pipelineRouter.post("/run", async (req, res) => {
  const { document, query, budget, referenceAnswer, meaningThreshold, model, provider, apiKey } = req.body ?? {};

  if (typeof document !== "string" || !document.trim()) {
    return res.status(400).json({ error: "`document` is required." });
  }
  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "`query` is required." });
  }
  if (document.length > MAX_CHARS) {
    return res.status(413).json({ error: `Document exceeds ${MAX_CHARS} character limit for this demo.` });
  }
  if (typeof budget !== "number" || budget <= 0) {
    return res.status(400).json({ error: "`budget` must be a positive number." });
  }

  try {
    const result = await runPipeline({
      document,
      query,
      budget,
      referenceAnswer,
      meaningThreshold: meaningThreshold ?? undefined,
      model: model || "gpt-4",
      provider,
      apiKey,
    });

    // Fire-and-forget: the dashboard is a nice-to-have layered on top of a
    // pipeline run that already succeeded, never a dependency of it.
    savePipelineRun(result, query).catch((err) => {
      console.error("[pipeline] failed to save run for dashboard:", err.message);
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Pipeline run failed." });
  }
});

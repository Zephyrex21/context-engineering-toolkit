import { Router } from "express";
import { compareContexts } from "../services/evaluator.js";
import { getAvailableProvider } from "../services/llmClient.js";

export const evaluateRouter = Router();

const MAX_CHARS = 100_000;

function llmErrorResponse(res, err) {
  if (err.code === "NO_LLM_CONFIGURED") {
    return res.status(503).json({ error: err.message, code: err.code });
  }
  if (err.status === 429) {
    return res
      .status(429)
      .json({ error: "Rate limited by the LLM provider's free tier. Wait a moment and try again." });
  }
  console.error(err);
  return res.status(502).json({ error: "The LLM provider request failed. Try again shortly." });
}

evaluateRouter.get("/status", (req, res) => {
  const provider = getAvailableProvider();
  res.json({ available: provider !== null, provider });
});

evaluateRouter.post("/compare", async (req, res) => {
  const { query, rawContext, engineeredContext, referenceAnswer, model, provider, apiKey } = req.body ?? {};

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "`query` is required." });
  }
  if (typeof rawContext !== "string" || !rawContext.trim()) {
    return res.status(400).json({ error: "`rawContext` is required." });
  }
  if (typeof engineeredContext !== "string" || !engineeredContext.trim()) {
    return res.status(400).json({ error: "`engineeredContext` is required." });
  }
  if (rawContext.length > MAX_CHARS || engineeredContext.length > MAX_CHARS) {
    return res.status(413).json({ error: `Context exceeds ${MAX_CHARS} character limit for this demo.` });
  }

  try {
    const result = await compareContexts({
      query,
      rawContext,
      engineeredContext,
      referenceAnswer,
      model: model || "gpt-4",
      provider,
      apiKey,
    });
    res.json(result);
  } catch (err) {
    llmErrorResponse(res, err);
  }
});

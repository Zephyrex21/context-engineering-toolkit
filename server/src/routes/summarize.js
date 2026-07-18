import { Router } from "express";
import { summarizeDocument, compressChatHistory } from "../services/summarizer.js";
import { getAvailableProvider } from "../services/llmClient.js";

export const summarizeRouter = Router();

const MAX_CHARS = 200_000;
const MAX_MESSAGES = 200;

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

summarizeRouter.get("/status", (req, res) => {
  const provider = getAvailableProvider();
  res.json({ available: provider !== null, provider });
});

summarizeRouter.post("/document", async (req, res) => {
  const { text, budget, chunkTokens, model, provider, apiKey } = req.body ?? {};

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "`text` is required." });
  }
  if (text.length > MAX_CHARS) {
    return res.status(413).json({ error: `Text exceeds ${MAX_CHARS} character limit for this demo.` });
  }
  if (typeof budget !== "number" || budget <= 0) {
    return res.status(400).json({ error: "`budget` must be a positive number." });
  }

  try {
    const result = await summarizeDocument({
      text,
      budget,
      chunkTokens: chunkTokens || undefined,
      model: model || "gpt-4",
      provider,
      apiKey, // bring-your-own-key: never logged, only forwarded to the provider
    });
    res.json(result);
  } catch (err) {
    llmErrorResponse(res, err);
  }
});

summarizeRouter.post("/chat", async (req, res) => {
  const { messages, keepRecent, targetSummaryTokens, model, provider, apiKey } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "`messages` must be a non-empty array." });
  }
  if (messages.length > MAX_MESSAGES) {
    return res.status(413).json({ error: `Too many messages — limit is ${MAX_MESSAGES} for this demo.` });
  }
  for (const m of messages) {
    if (typeof m.role !== "string" || typeof m.content !== "string") {
      return res.status(400).json({ error: "Each message needs `role` and `content` strings." });
    }
  }

  try {
    const result = await compressChatHistory({
      messages,
      keepRecent: keepRecent ?? undefined,
      targetSummaryTokens: targetSummaryTokens ?? undefined,
      model: model || "gpt-4",
      provider,
      apiKey,
    });
    res.json(result);
  } catch (err) {
    llmErrorResponse(res, err);
  }
});

import { Router } from "express";
import { compressText } from "../services/compressor.js";

export const compressRouter = Router();

const MAX_CHARS = 200_000;

compressRouter.post("/", async (req, res) => {
  const { text, budget, query, model, dedupeThreshold } = req.body ?? {};

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "`text` is required." });
  }
  if (text.length > MAX_CHARS) {
    return res.status(413).json({ error: `Text exceeds ${MAX_CHARS} character limit for this demo.` });
  }
  if (typeof budget !== "number" || budget <= 0) {
    return res.status(400).json({ error: "`budget` must be a positive number." });
  }
  if (query !== undefined && typeof query !== "string") {
    return res.status(400).json({ error: "`query`, if provided, must be a string." });
  }

  try {
    const result = await compressText({
      text,
      budget,
      query: query && query.trim() ? query.trim() : undefined,
      model: model || "gpt-4",
      dedupeThreshold: dedupeThreshold ?? undefined,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compress text." });
  }
});

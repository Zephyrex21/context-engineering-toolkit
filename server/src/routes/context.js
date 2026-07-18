import { Router } from "express";
import { selectContext } from "../services/contextSelector.js";
import { getEmbeddingMode } from "../services/embeddings.js";

export const contextRouter = Router();

const MAX_DOC_CHARS = 200_000;

contextRouter.get("/status", (req, res) => {
  res.json({ embeddingMode: getEmbeddingMode() });
});

contextRouter.post("/select", async (req, res) => {
  const {
    document,
    query,
    budget,
    chunkTokens,
    overlapSentences,
    mmrLambda,
    overrides,
    model,
  } = req.body ?? {};

  if (typeof document !== "string" || !document.trim()) {
    return res.status(400).json({ error: "`document` is required." });
  }
  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "`query` is required." });
  }
  if (document.length > MAX_DOC_CHARS) {
    return res
      .status(413)
      .json({ error: `Document exceeds ${MAX_DOC_CHARS} character limit for this demo.` });
  }
  if (typeof budget !== "number" || budget <= 0) {
    return res.status(400).json({ error: "`budget` must be a positive number." });
  }
  if (Array.isArray(overrides)) {
    for (const o of overrides) {
      if (typeof o.index !== "number" || !["always", "never"].includes(o.tier)) {
        return res
          .status(400)
          .json({ error: 'Each override needs `index` (number) and `tier` ("always"|"never").' });
      }
    }
  }

  try {
    const result = await selectContext({
      document,
      query,
      budget,
      chunkTokens: chunkTokens || undefined,
      overlapSentences: overlapSentences ?? undefined,
      mmrLambda: mmrLambda ?? undefined,
      overrides: Array.isArray(overrides) ? overrides : [],
      model: model || "gpt-4",
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to select context." });
  }
});

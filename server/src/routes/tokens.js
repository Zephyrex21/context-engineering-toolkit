import { Router } from "express";
import { countTokens, countTokensAllModels, SUPPORTED_MODELS } from "../services/tokenizer.js";

export const tokensRouter = Router();

// Public free-tier demo guard — keeps one visitor from hammering the
// (single, free) Render instance with huge payloads.
const MAX_CHARS = 200_000;

function budgetInfo(count, budget) {
  if (budget === undefined || budget === null) return null;
  const remaining = budget - count;
  return {
    limit: budget,
    used: count,
    remaining,
    withinBudget: remaining >= 0,
    percentUsed: budget > 0 ? Math.round((count / budget) * 1000) / 10 : null,
  };
}

function validateText(text, res) {
  if (typeof text !== "string") {
    res.status(400).json({ error: "`text` must be a string." });
    return false;
  }
  if (text.length > MAX_CHARS) {
    res.status(413).json({ error: `Text exceeds ${MAX_CHARS} character limit for this demo.` });
    return false;
  }
  return true;
}

tokensRouter.get("/models", (req, res) => {
  res.json({ models: SUPPORTED_MODELS });
});

// Single model count
tokensRouter.post("/count", (req, res) => {
  const { text = "", model = "gpt-4", budget } = req.body ?? {};
  if (!validateText(text, res)) return;

  try {
    const result = countTokens(text, model);
    res.json({ ...result, budget: budgetInfo(result.count, budget) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// All supported models at once — powers the comparison view
tokensRouter.post("/count-all", (req, res) => {
  const { text = "", budget } = req.body ?? {};
  if (!validateText(text, res)) return;

  const perModel = countTokensAllModels(text);
  const results = Object.fromEntries(
    Object.entries(perModel).map(([model, result]) => [
      model,
      { ...result, budget: budgetInfo(result.count, budget) },
    ])
  );
  res.json({ results });
});

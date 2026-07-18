import { countTokens } from "./tokenizer.js";
import { embedTexts } from "./embeddings.js";
import { cosineSimilarity } from "./similarity.js";
import { callLLM } from "./llmClient.js";
import { estimateCost } from "./pricing.js";

function answerPrompt(query, context) {
  return `Answer the question using ONLY the context provided. If the context doesn't contain the answer, say so plainly. Be concise.\n\nCONTEXT:\n${context}\n\nQUESTION:\n${query}`;
}

function judgePrompt(query, answer) {
  return `You are grading an AI answer. Given the question and answer below, rate how well the answer addresses the question on a scale from 1 to 10, where 10 means it fully and accurately answers the question and 1 means it doesn't answer it at all. Respond with ONLY a single integer, nothing else.\n\nQUESTION:\n${query}\n\nANSWER:\n${answer}`;
}

function parseScore(text) {
  const match = text.match(/\d+(\.\d+)?/);
  if (!match) return null;
  return Math.max(1, Math.min(10, parseFloat(match[0])));
}

async function runOne({ query, context, model, provider, apiKey }) {
  const tokensIn = countTokens(context, model).count + countTokens(query, model).count;
  const start = Date.now();
  const { text: answer, provider: usedProvider, model: usedModel } = await callLLM(
    answerPrompt(query, context),
    { provider, apiKey }
  );
  const latencyMs = Date.now() - start;
  const tokensOut = countTokens(answer, model).count;
  const costEstimate = estimateCost(usedModel, tokensIn, tokensOut);
  return { answer, tokensIn, tokensOut, latencyMs, costEstimate, provider: usedProvider, model: usedModel };
}

/**
 * The payoff comparison: same query, two contexts (raw/unprocessed vs.
 * engineered/trimmed), two real answers, and a score for which one actually
 * answered better. Scoring uses reference-answer similarity if one's given
 * (cheap, no extra LLM call), otherwise falls back to LLM-as-judge (two
 * extra calls) — same query-aware/generic-fallback pattern as Phase 3.
 */
export async function compareContexts({
  query,
  rawContext,
  engineeredContext,
  referenceAnswer,
  model = "gpt-4",
  provider,
  apiKey,
}) {
  // Run raw first, then pin the engineered call to whichever provider raw
  // actually resolved to — keeps both halves of the comparison on the same
  // model instead of silently mixing providers mid-run.
  const raw = await runOne({ query, context: rawContext, model, provider, apiKey });
  const engineered = await runOne({
    query,
    context: engineeredContext,
    model,
    provider: raw.provider,
    apiKey,
  });

  let scoring;
  if (referenceAnswer && referenceAnswer.trim()) {
    const { vectors } = await embedTexts([referenceAnswer, raw.answer, engineered.answer]);
    scoring = {
      method: "reference-similarity",
      raw: Math.round(cosineSimilarity(vectors[0], vectors[1]) * 1000) / 1000,
      engineered: Math.round(cosineSimilarity(vectors[0], vectors[2]) * 1000) / 1000,
    };
  } else {
    const rawJudge = await callLLM(judgePrompt(query, raw.answer), { provider: raw.provider, apiKey });
    const engineeredJudge = await callLLM(judgePrompt(query, engineered.answer), {
      provider: raw.provider,
      apiKey,
    });
    scoring = {
      method: "llm-judge",
      raw: parseScore(rawJudge.text),
      engineered: parseScore(engineeredJudge.text),
    };
  }

  const tokensSaved = raw.tokensIn - engineered.tokensIn;
  const tokensSavedPercent =
    raw.tokensIn > 0 ? Math.round((tokensSaved / raw.tokensIn) * 1000) / 10 : 0;
  const costSaved =
    raw.costEstimate !== null && engineered.costEstimate !== null
      ? Math.round((raw.costEstimate - engineered.costEstimate) * 1_000_000) / 1_000_000
      : null;

  return { raw, engineered, scoring, tokensSaved, tokensSavedPercent, costSaved };
}

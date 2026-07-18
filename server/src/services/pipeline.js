import { selectContext } from "./contextSelector.js";
import { compressText } from "./compressor.js";
import { summarizeDocument } from "./summarizer.js";
import { compareContexts } from "./evaluator.js";
import { getAvailableProvider } from "./llmClient.js";
import { countTokens } from "./tokenizer.js";

const MEANING_THRESHOLD_DEFAULT = 0.55;
// Selection gets more room than the final budget so the compressor (which
// is query-aware and does redundancy stripping) has real material to work
// with, instead of already being squeezed to the final size before it runs.
const SELECTION_BUDGET_MULTIPLIER = 2.2;

/**
 * The real pipeline, not a fake animation: scissors (select) -> funnel
 * (compress) -> gear (LLM summarize, but ONLY if extraction demonstrably
 * lost too much meaning) -> gauge (prove it against the raw original).
 *
 * Stages 1-2 never need an LLM and never fail gracefully-degradable ways.
 * Stages 3-4 are wrapped so a failure there (no key, rate limit, network)
 * reports as a skipped/failed stage instead of discarding the real work
 * stages 1-2 already did.
 */
export async function runPipeline({
  document,
  query,
  budget,
  referenceAnswer,
  meaningThreshold = MEANING_THRESHOLD_DEFAULT,
  model = "gpt-4",
  provider,
  apiKey,
}) {
  const originalTokens = countTokens(document, model).count;
  // A visitor-supplied key makes the LLM "available" regardless of what's
  // configured server-side — bring-your-own-key bypasses the server check
  // entirely, same as it does one level down in llmClient.
  const llmAvailable = getAvailableProvider(provider) !== null || Boolean(apiKey);

  // Stage 1 — scissors: select relevant chunks from the full document.
  // Chunk size is scaled to the selection budget, not left at the
  // context-selector's default — otherwise a document small enough to fit
  // in one default-size chunk becomes an all-or-nothing unit instead of
  // something that can be genuinely partially selected.
  const selectionBudget = Math.max(Math.round(budget * SELECTION_BUDGET_MULTIPLIER), budget + 20);
  const selectionChunkTokens = Math.max(Math.round(selectionBudget / 5), 30);
  const selectResult = await selectContext({
    document,
    query,
    budget: selectionBudget,
    chunkTokens: selectionChunkTokens,
    model,
  });
  const selectedText = selectResult.selected.map((c) => c.text).join(" ") || document;

  // Stage 2 — funnel: compress the selected text down to the final budget.
  const compressResult = await compressText({ text: selectedText, budget, query, model });

  let finalContext = compressResult.compressedText;
  let finalTokens = compressResult.compressedTokens;
  let finalMeaningPreserved = compressResult.meaningPreserved;

  // Stage 3 — gear: only spend an LLM call if extraction alone fell short.
  let summarizeStage = { triggered: false, reason: null };
  try {
    const belowThreshold =
      compressResult.meaningPreserved !== null && compressResult.meaningPreserved < meaningThreshold;

    if (!belowThreshold) {
      summarizeStage = {
        triggered: false,
        reason:
          compressResult.meaningPreserved !== null
            ? `Extractive compression already preserved ${compressResult.meaningPreserved} of the original meaning — no need to spend an LLM call.`
            : "Nothing left to summarize.",
      };
    } else if (!llmAvailable) {
      summarizeStage = {
        triggered: false,
        reason: `Extractive compression only preserved ${compressResult.meaningPreserved} of the original meaning (below the ${meaningThreshold} threshold), but no LLM is configured to do better.`,
      };
    } else {
      const summarizeResult = await summarizeDocument({
        text: selectedText,
        budget,
        model,
        provider,
        apiKey,
      });
      const improved =
        summarizeResult.meaningPreserved !== null &&
        (finalMeaningPreserved === null || summarizeResult.meaningPreserved > finalMeaningPreserved);

      summarizeStage = {
        triggered: true,
        used: improved,
        reason: improved
          ? `Extractive compression only preserved ${compressResult.meaningPreserved} of the original meaning (below the ${meaningThreshold} threshold) — upgraded to LLM summarization, which preserved ${summarizeResult.meaningPreserved}.`
          : `LLM summarization was attempted but didn't outperform extraction (${summarizeResult.meaningPreserved} vs ${compressResult.meaningPreserved}) — kept the extractive result.`,
        ...summarizeResult,
      };

      if (improved) {
        finalContext = summarizeResult.summary;
        finalTokens = summarizeResult.summaryTokens;
        finalMeaningPreserved = summarizeResult.meaningPreserved;
      }
    }
  } catch (err) {
    summarizeStage = { triggered: false, error: err.message };
  }

  // Stage 4 — gauge: prove it against the raw, unprocessed original.
  let evaluateStage = { skipped: true, reason: "No LLM configured." };
  if (llmAvailable && finalContext.trim()) {
    try {
      const compareResult = await compareContexts({
        query,
        rawContext: document,
        engineeredContext: finalContext,
        referenceAnswer,
        model,
        provider,
        apiKey,
      });
      evaluateStage = { skipped: false, ...compareResult };
    } catch (err) {
      evaluateStage = { skipped: true, error: err.message };
    }
  }

  return {
    originalTokens,
    finalTokens,
    finalContext,
    finalMeaningPreserved,
    overallReductionPercent:
      originalTokens > 0 ? Math.round((1 - finalTokens / originalTokens) * 1000) / 10 : 0,
    llmAvailable,
    stages: {
      select: {
        chunkCount: selectResult.chunkCount,
        selectedCount: selectResult.selected.length,
        tokensAfter: selectResult.totalTokens,
        embeddingMode: selectResult.embeddingMode,
        chunks: selectResult.chunks,
      },
      compress: {
        tokensBefore: compressResult.originalTokens,
        tokensAfter: compressResult.compressedTokens,
        compressionRatio: compressResult.compressionRatio,
        meaningPreserved: compressResult.meaningPreserved,
        dedupedCount: compressResult.dedupedCount,
        sentences: compressResult.sentences,
      },
      summarize: summarizeStage,
      evaluate: evaluateStage,
    },
  };
}

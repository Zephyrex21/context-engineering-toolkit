import { chunkText } from "./chunker.js";
import { countTokens } from "./tokenizer.js";
import { embedTexts } from "./embeddings.js";
import { cosineSimilarity } from "./similarity.js";
import { callLLM } from "./llmClient.js";

// Demo-scale + free-tier-rate-limit guard: each chunk is one LLM call, and
// free tiers are commonly ~10-15 requests/minute. Capping keeps a single
// document summarization request from eating the whole per-minute budget.
const MAX_MAP_CHUNKS = 6;

function chunkSummaryPrompt(text, targetTokens) {
  return `Summarize the following text in about ${targetTokens} tokens or fewer. Preserve concrete facts, numbers, and names. Output only the summary, with no preamble or commentary.\n\nTEXT:\n${text}`;
}

function reducePrompt(combinedSummaries, targetTokens) {
  return `The following are summaries of consecutive sections of a longer document. Combine them into a single coherent summary of about ${targetTokens} tokens or fewer, removing redundancy between sections. Output only the final summary, with no preamble.\n\nSECTION SUMMARIES:\n${combinedSummaries}`;
}

function chatSummaryPrompt(transcript, targetTokens) {
  return `Summarize the following conversation in about ${targetTokens} tokens or fewer. Preserve names, decisions, and facts a continuing assistant would need. Output only the summary, with no preamble.\n\nCONVERSATION:\n${transcript}`;
}

async function meaningPreservedScore(original, compressed) {
  if (!compressed.trim()) return null;
  const { vectors } = await embedTexts([original, compressed]);
  return Math.round(cosineSimilarity(vectors[0], vectors[1]) * 1000) / 1000;
}

/**
 * Map-reduce document summarization. If the document already fits the
 * budget, this is a no-op (no LLM call, no cost) — only reaches for the
 * LLM when extractive methods (Phase 3) genuinely aren't enough.
 */
export async function summarizeDocument({
  text,
  budget,
  chunkTokens = 600,
  model = "gpt-4",
  provider,
  apiKey,
}) {
  const originalTokens = countTokens(text, model).count;

  if (originalTokens <= budget) {
    return {
      originalTokens,
      summaryTokens: originalTokens,
      compressionRatio: 0,
      summary: text,
      mapChunkCount: 0,
      meaningPreserved: 1,
      provider: null,
      model: null,
      skipped: true,
    };
  }

  const chunks = chunkText(text, { maxTokens: chunkTokens, overlapSentences: 0, model }).slice(
    0,
    MAX_MAP_CHUNKS
  );
  const perChunkBudget = Math.max(Math.floor(budget / chunks.length), 30);

  // Map: summarize each chunk independently.
  const mapSummaries = [];
  let usedProvider = null;
  let usedModel = null;
  for (const chunk of chunks) {
    const { text: summary, provider: p, model: m } = await callLLM(
      chunkSummaryPrompt(chunk.text, perChunkBudget),
      { provider, apiKey }
    );
    mapSummaries.push(summary);
    usedProvider = p;
    usedModel = m;
  }

  const combined = mapSummaries.join("\n\n");
  const combinedTokens = countTokens(combined, model).count;

  // Reduce: one combine pass, only if the map output still overshoots budget.
  let finalSummary = combined;
  if (combinedTokens > budget) {
    const { text: reduced } = await callLLM(reducePrompt(combined, budget), {
      provider: usedProvider,
      apiKey,
    });
    finalSummary = reduced;
  }

  const summaryTokens = countTokens(finalSummary, model).count;
  const meaningPreserved = await meaningPreservedScore(text, finalSummary);

  return {
    originalTokens,
    summaryTokens,
    compressionRatio:
      originalTokens > 0 ? Math.round((1 - summaryTokens / originalTokens) * 1000) / 10 : 0,
    summary: finalSummary,
    mapChunkCount: chunks.length,
    meaningPreserved,
    provider: usedProvider,
    model: usedModel,
    skipped: false,
  };
}

/**
 * Sliding-window chat compression: keeps the last `keepRecent` messages
 * verbatim, summarizes everything older into one system-style message.
 * No-op (no LLM call) if there's nothing old enough to summarize.
 */
export async function compressChatHistory({
  messages,
  keepRecent = 4,
  targetSummaryTokens = 150,
  model = "gpt-4",
  provider,
  apiKey,
}) {
  const asTranscript = (msgs) => msgs.map((m) => `${m.role}: ${m.content}`).join("\n");

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      compressedMessages: [],
      originalTokens: 0,
      compressedTokens: 0,
      compressionRatio: 0,
      summary: null,
      turnsSummarized: 0,
      provider: null,
      model: null,
    };
  }

  const originalTokens = countTokens(asTranscript(messages), model).count;
  const recent = messages.slice(-keepRecent);
  const older = messages.slice(0, Math.max(messages.length - keepRecent, 0));

  if (older.length === 0) {
    return {
      compressedMessages: messages,
      originalTokens,
      compressedTokens: originalTokens,
      compressionRatio: 0,
      summary: null,
      turnsSummarized: 0,
      provider: null,
      model: null,
    };
  }

  const { text: summary, provider: p, model: m } = await callLLM(
    chatSummaryPrompt(asTranscript(older), targetSummaryTokens),
    { provider, apiKey }
  );

  const compressedMessages = [
    { role: "system", content: `[Summary of earlier conversation]: ${summary}` },
    ...recent,
  ];
  const compressedTokens = countTokens(asTranscript(compressedMessages), model).count;

  return {
    compressedMessages,
    originalTokens,
    compressedTokens,
    compressionRatio:
      originalTokens > 0 ? Math.round((1 - compressedTokens / originalTokens) * 1000) / 10 : 0,
    summary,
    turnsSummarized: older.length,
    provider: p,
    model: m,
  };
}

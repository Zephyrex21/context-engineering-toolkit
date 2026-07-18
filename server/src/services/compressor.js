import { splitSentences } from "./chunker.js";
import { embedTexts } from "./embeddings.js";
import { cosineSimilarity } from "./similarity.js";
import { countTokens } from "./tokenizer.js";

// Demo-scale guard — centrality scoring is O(n^2), fine for hundreds of
// sentences, not for someone pasting a whole novel.
const MAX_SENTENCES = 500;
const DEFAULT_DEDUPE_THRESHOLD = 0.93;

/**
 * No query given -> generic importance scoring via centrality: a sentence
 * that's, on average, similar to every other sentence is representative of
 * the document's main themes (same idea behind TextRank/LexRank, simplified
 * to a single averaging pass instead of graph centrality — good enough at
 * this scale, and a lot cheaper to explain and to compute).
 */
function scoreByCentrality(vectors) {
  if (vectors.length <= 1) return vectors.map(() => 1);
  return vectors.map((v, i) => {
    let sum = 0;
    for (let j = 0; j < vectors.length; j++) {
      if (i !== j) sum += cosineSimilarity(v, vectors[j]);
    }
    return sum / (vectors.length - 1);
  });
}

export async function compressText({
  text,
  budget,
  query,
  model = "gpt-4",
  dedupeThreshold = DEFAULT_DEDUPE_THRESHOLD,
}) {
  const sentences = splitSentences(text).slice(0, MAX_SENTENCES);

  if (sentences.length === 0) {
    return {
      originalTokens: 0,
      compressedTokens: 0,
      compressionRatio: 0,
      compressedText: "",
      sentences: [],
      meaningPreserved: null,
      embeddingMode: "n/a",
      dedupedCount: 0,
    };
  }

  const originalTokens = countTokens(text, model).count;

  const textsToEmbed = query ? [...sentences, query] : sentences;
  const { vectors, mode } = await embedTexts(textsToEmbed);
  const sentenceVectors = vectors.slice(0, sentences.length);
  const queryVector = query ? vectors[vectors.length - 1] : null;

  // 1. Redundancy strip — greedy, first occurrence wins.
  const keptIndexes = [];
  const keptVectors = [];
  const dropReason = new Array(sentences.length).fill(null);

  sentences.forEach((_, i) => {
    const vec = sentenceVectors[i];
    const isDuplicate = keptVectors.some((kv) => cosineSimilarity(vec, kv) >= dedupeThreshold);
    if (isDuplicate) {
      dropReason[i] = "redundant";
    } else {
      keptIndexes.push(i);
      keptVectors.push(vec);
    }
  });

  // 2. Score the survivors.
  const candidateVectors = keptIndexes.map((i) => sentenceVectors[i]);
  const scores = queryVector
    ? candidateVectors.map((v) => cosineSimilarity(v, queryVector))
    : scoreByCentrality(candidateVectors);

  const candidates = keptIndexes.map((index, k) => ({
    index,
    score: scores[k],
    tokenCount: countTokens(sentences[index], model).count,
  }));

  // 3. Greedy budget-fill, highest score first.
  const byScore = [...candidates].sort((a, b) => b.score - a.score);
  const selected = new Set();
  let usedTokens = 0;
  for (const c of byScore) {
    if (usedTokens + c.tokenCount > budget) {
      dropReason[c.index] = "over_budget";
      continue;
    }
    selected.add(c.index);
    usedTokens += c.tokenCount;
  }

  // 4. Rebuild in original document order for readability.
  const compressedText = [...selected]
    .sort((a, b) => a - b)
    .map((i) => sentences[i])
    .join(" ");
  const compressedTokens = countTokens(compressedText, model).count;

  // 5. Meaning-preserved proxy: embedding similarity of full original vs
  // full compressed text. Cheap sanity check that compression didn't gut
  // the document's overall meaning, without an LLM call.
  let meaningPreserved = null;
  if (compressedText.trim()) {
    const { vectors: docVectors } = await embedTexts([text, compressedText]);
    meaningPreserved = Math.round(cosineSimilarity(docVectors[0], docVectors[1]) * 1000) / 1000;
  }

  const scoreByIndex = new Map(candidates.map((c) => [c.index, c.score]));
  const sentencesOut = sentences.map((s, i) => ({
    index: i,
    text: s,
    tokenCount: countTokens(s, model).count,
    score: scoreByIndex.has(i) ? Math.round(scoreByIndex.get(i) * 1000) / 1000 : null,
    kept: selected.has(i),
    dropReason: selected.has(i) ? null : dropReason[i],
  }));

  return {
    originalTokens,
    compressedTokens,
    compressionRatio:
      originalTokens > 0 ? Math.round((1 - compressedTokens / originalTokens) * 1000) / 10 : 0,
    compressedText,
    sentences: sentencesOut,
    meaningPreserved,
    embeddingMode: mode,
    dedupedCount: dropReason.filter((r) => r === "redundant").length,
  };
}

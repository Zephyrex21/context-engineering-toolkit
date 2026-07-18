import { chunkText } from "./chunker.js";
import { embedTexts } from "./embeddings.js";
import { cosineSimilarity } from "./similarity.js";

// Demo-scale guard — keeps one huge paste from making a request run away
// on the (single, free) server instance.
const MAX_CHUNKS = 300;

/**
 * Greedy MMR selection: repeatedly pick the candidate that best balances
 * relevance to the query against redundancy with what's already picked,
 * skipping anything that would blow the remaining budget and trying the
 * next-best instead. This is a greedy budget-fill, not an optimal knapsack —
 * that tradeoff is intentional: it's O(n^2)-ish and fast enough for
 * dozens-to-low-hundreds of chunks, which covers this tool's real use case.
 */
function mmrSelect(candidates, { budget, lambda }) {
  const pool = [...candidates].sort((a, b) => b.similarity - a.similarity);
  const selected = [];
  let usedTokens = 0;

  while (pool.length > 0) {
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const simToSelected = selected.length
        ? Math.max(...selected.map((s) => cosineSimilarity(candidate.vector, s.vector)))
        : 0;
      const score = lambda * candidate.similarity - (1 - lambda) * simToSelected;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    const best = pool[bestIndex];
    pool.splice(bestIndex, 1);

    if (usedTokens + best.tokenCount > budget) {
      continue; // doesn't fit — skip it, keep trying the rest of the pool
    }
    selected.push(best);
    usedTokens += best.tokenCount;
  }

  return { selected, usedTokens };
}

export async function selectContext({
  document,
  query,
  budget,
  chunkTokens = 180,
  overlapSentences = 1,
  mmrLambda = 0.5,
  overrides = [],
  model = "gpt-4",
}) {
  const chunks = chunkText(document, { maxTokens: chunkTokens, overlapSentences, model }).slice(
    0,
    MAX_CHUNKS
  );

  if (chunks.length === 0) {
    return {
      chunks: [],
      selected: [],
      totalTokens: 0,
      budget: { limit: budget, used: 0, remaining: budget, withinBudget: true },
      embeddingMode: "n/a",
      chunkCount: 0,
    };
  }

  const overrideMap = new Map(overrides.map((o) => [o.index, o.tier]));

  const { vectors, mode } = await embedTexts([...chunks.map((c) => c.text), query]);
  const chunkVectors = vectors.slice(0, chunks.length);
  const queryVector = vectors[vectors.length - 1];

  const scored = chunks.map((c, i) => ({
    ...c,
    vector: chunkVectors[i],
    similarity: cosineSimilarity(chunkVectors[i], queryVector),
    tier: overrideMap.get(c.index) ?? null,
  }));

  const alwaysChunks = scored.filter((c) => c.tier === "always");
  const candidateChunks = scored.filter((c) => c.tier !== "always" && c.tier !== "never");

  const selectedIndexes = new Set(alwaysChunks.map((c) => c.index));
  let usedTokens = alwaysChunks.reduce((sum, c) => sum + c.tokenCount, 0);

  const remainingBudget = Math.max(budget - usedTokens, 0);
  const { selected: mmrSelected, usedTokens: mmrUsed } = mmrSelect(candidateChunks, {
    budget: remainingBudget,
    lambda: mmrLambda,
  });
  mmrSelected.forEach((c) => selectedIndexes.add(c.index));
  usedTokens += mmrUsed;

  const allChunksOut = scored
    .map((c) => ({
      index: c.index,
      text: c.text,
      tokenCount: c.tokenCount,
      similarity: Math.round(c.similarity * 1000) / 1000,
      tier: c.tier,
      included: selectedIndexes.has(c.index),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const selectedOut = allChunksOut.filter((c) => c.included).sort((a, b) => a.index - b.index);

  return {
    chunks: allChunksOut,
    selected: selectedOut,
    totalTokens: usedTokens,
    budget: {
      limit: budget,
      used: usedTokens,
      remaining: budget - usedTokens,
      withinBudget: usedTokens <= budget,
    },
    embeddingMode: mode,
    chunkCount: chunks.length,
  };
}

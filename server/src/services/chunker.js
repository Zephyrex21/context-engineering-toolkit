import { countTokens } from "./tokenizer.js";

// Deliberately simple sentence splitter — good enough for prose/docs, not a
// full NLP segmenter. Splits on sentence-ending punctuation followed by
// whitespace, and treats blank lines as hard paragraph breaks.
export function splitSentences(text) {
  const paragraphs = text.split(/\n\s*\n/);
  const sentences = [];
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/);
    for (const p of parts) {
      const s = p.trim();
      if (s) sentences.push(s);
    }
  }
  return sentences;
}

/**
 * Greedily packs sentences into chunks under `maxTokens`, carrying the last
 * `overlapSentences` sentences into the next chunk for retrieval continuity
 * (so a fact split across a chunk boundary doesn't lose context).
 */
export function chunkText(text, { maxTokens = 180, overlapSentences = 1, model = "gpt-4" } = {}) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const chunks = [];
  let current = [];
  let currentTokens = 0;
  let i = 0;

  const flush = () => {
    const chunkText = current.join(" ");
    chunks.push({ text: chunkText, tokenCount: countTokens(chunkText, model).count });
  };

  while (i < sentences.length) {
    const sentence = sentences[i];
    const sTokens = countTokens(sentence, model).count;

    if (current.length > 0 && currentTokens + sTokens > maxTokens) {
      flush();
      // slice(-overlapSentences) breaks when overlapSentences is 0: -0 === 0,
      // and array.slice(0) returns the WHOLE array, not an empty one. Handle
      // the zero-overlap case explicitly instead of relying on that.
      const overlap = overlapSentences > 0 ? current.slice(-overlapSentences) : [];
      current = [...overlap];
      currentTokens = countTokens(current.join(" "), model).count;
      // Deliberately no `continue`/re-check here: i always advances exactly
      // once per outer-loop iteration, which guarantees termination. The
      // tradeoff is a chunk can slightly exceed maxTokens right after an
      // overlap reset (overlap + one sentence) — acceptable for a soft
      // budget, and far better than a retry loop that can never make
      // progress if the overlap sentence alone is already near the budget.
    }

    current.push(sentence);
    currentTokens += sTokens;
    i++;
  }

  if (current.length > 0) flush();

  return chunks.map((c, index) => ({ index, ...c }));
}

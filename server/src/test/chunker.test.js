import { describe, it, expect } from "vitest";
import { chunkText, splitSentences } from "../services/chunker.js";

describe("chunker", () => {
  it("splits text into sentences on paragraph and sentence boundaries", () => {
    const text = "First sentence. Second sentence.\n\nNew paragraph starts here.";
    const sentences = splitSentences(text);
    expect(sentences.length).toBe(3);
    expect(sentences[0]).toMatch(/First sentence/);
    expect(sentences[2]).toMatch(/New paragraph/);
  });

  it("returns empty array for empty/whitespace-only input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("packs sentences into chunks respecting the token budget", () => {
    const text =
      "This is the first sentence in the document. This is the second sentence here. " +
      "This is the third sentence in this document. This is the fourth sentence written.";
    const chunks = chunkText(text, { maxTokens: 15, overlapSentences: 0 });
    expect(chunks.length).toBeGreaterThan(1);
    // No chunk should wildly exceed the budget (a little slack is allowed by design).
    for (const c of chunks) {
      expect(c.tokenCount).toBeLessThan(30);
    }
  });

  it("REGRESSION: zero overlap does not cause cumulative chunk growth (the slice(-0) bug)", () => {
    // Historical bug: `current.slice(-overlapSentences)` with overlapSentences=0 hit
    // `slice(-0)` which is `slice(0)` in JS — returning the WHOLE array instead of
    // empty, causing each new chunk to include everything from the previous one.
    // Found via manual testing during development; this test exists so it can never
    // silently regress again.
    const paragraph = (n) =>
      `This is paragraph number ${n} discussing topic ${n} in some detail with several distinct facts about subject ${n}. It contains enough unique content to be distinguishable from other paragraphs. `;
    const longDoc = Array.from({ length: 12 }, (_, i) => paragraph(i)).join("\n\n");

    const chunks = chunkText(longDoc, { maxTokens: 80, overlapSentences: 0 });

    // Correct behavior: ~6 roughly-equal-sized chunks, NOT ~20+ cumulatively-growing ones.
    expect(chunks.length).toBeLessThan(10);

    // The bug's actual signature: cumulative growth means chunk N contains ALL of
    // chunk N-1's text as a prefix. Check directly for that, rather than an
    // indirect proxy like token-count ordering (which can coincidentally hold
    // true or false depending on input structure and isn't a reliable signal).
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].text.startsWith(chunks[i - 1].text)).toBe(false);
    }

    // Every chunk should start with a genuinely different paragraph, not all
    // starting from "paragraph number 0" (the bug's other symptom).
    const firstWords = chunks.map((c) => c.text.slice(0, 40));
    expect(new Set(firstWords).size).toBe(chunks.length);
  });

  it("overlapSentences=1 correctly carries the last sentence into the next chunk", () => {
    const text =
      "Alpha sentence one here. Beta sentence two here. Gamma sentence three here.";
    const chunks = chunkText(text, { maxTokens: 12, overlapSentences: 1 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    // The overlap sentence should appear in two consecutive chunks.
    const chunk0Sentences = chunks[0].text;
    const chunk1Sentences = chunks[1].text;
    const lastSentenceOfChunk0 = chunk0Sentences.split(". ").slice(-1)[0];
    expect(chunk1Sentences).toContain(lastSentenceOfChunk0.replace(/\.$/, ""));
  });

  it("a single sentence longer than the budget still produces one chunk instead of looping forever", () => {
    const hugSentence =
      "This is a single extremely long sentence that by itself already exceeds any reasonable small token budget because it just keeps going and going without any punctuation to break it up into smaller pieces at all.";
    const chunks = chunkText(hugSentence, { maxTokens: 5, overlapSentences: 1 });
    expect(chunks.length).toBe(1);
  });

  it("chunk indexes are sequential starting from 0", () => {
    const text = "One sentence. Two sentence. Three sentence. Four sentence.";
    const chunks = chunkText(text, { maxTokens: 8, overlapSentences: 0 });
    chunks.forEach((c, i) => expect(c.index).toBe(i));
  });
});

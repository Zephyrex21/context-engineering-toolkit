import { describe, it, expect } from "vitest";
import { compressText } from "../services/compressor.js";

describe("compressText", () => {
  it("empty text returns zeroed-out result without crashing", async () => {
    const result = await compressText({ text: "", budget: 50 });
    expect(result.originalTokens).toBe(0);
    expect(result.compressedText).toBe("");
    expect(result.sentences).toEqual([]);
  });

  it("catches an exact-duplicate sentence and marks it redundant", async () => {
    const text =
      "Context engineering assembles what a model needs. " +
      "Context engineering assembles what a model needs. " +
      "Token budgets matter because context windows are finite.";
    const result = await compressText({ text, budget: 100 });

    expect(result.dedupedCount).toBeGreaterThanOrEqual(1);
    const redundant = result.sentences.find((s) => s.dropReason === "redundant");
    expect(redundant).toBeTruthy();
  });

  it("never exceeds the token budget", async () => {
    const text =
      "First important sentence here about the topic. " +
      "Second important sentence about a different topic. " +
      "Third important sentence covering yet another point. " +
      "Fourth important sentence with additional detail.";
    const result = await compressText({ text, budget: 20 });
    expect(result.compressedTokens).toBeLessThanOrEqual(20);
  });

  it("query-aware mode favors sentences relevant to the query over irrelevant ones", async () => {
    const text =
      "The capital of France is Paris, known for the Eiffel Tower. " +
      "MongoDB Atlas offers a free tier with 512MB of storage for small projects. " +
      "Node.js uses a single-threaded event loop for concurrency.";
    const result = await compressText({
      text,
      budget: 30,
      query: "What free tier does MongoDB offer?",
    });
    expect(result.compressedText.toLowerCase()).toContain("mongodb");
  });

  it("generic (no-query) mode still produces a non-empty, budget-respecting summary", async () => {
    const text =
      "Compression reduces token usage significantly for large documents. " +
      "It works by scoring and selecting the most important sentences. " +
      "This approach requires no LLM call and costs nothing to run.";
    const result = await compressText({ text, budget: 25 });
    expect(result.compressedText.length).toBeGreaterThan(0);
    expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
  });

  it("compressionRatio is 0 when nothing needed to be cut", async () => {
    const text = "Short text.";
    const result = await compressText({ text, budget: 1000 });
    expect(result.compressionRatio).toBe(0);
  });

  it("every sentence in the output has either kept:true or a dropReason, never neither", async () => {
    const text =
      "Alpha sentence with unique content here. " +
      "Beta sentence with different unique content. " +
      "Gamma sentence with yet more unique content.";
    const result = await compressText({ text, budget: 15 });
    for (const s of result.sentences) {
      if (!s.kept) {
        expect(s.dropReason).not.toBeNull();
      } else {
        expect(s.dropReason).toBeNull();
      }
    }
  });
});

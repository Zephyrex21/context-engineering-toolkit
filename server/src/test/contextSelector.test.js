import { describe, it, expect } from "vitest";
import { selectContext } from "../services/contextSelector.js";

const DOC =
  "Context engineering is the discipline of assembling exactly what a model needs to see before it answers. " +
  "It goes beyond prompt engineering by treating the entire information architecture as the design surface.\n\n" +
  "Token budgets matter because every model has a finite context window. Overflowing that window forces truncation. " +
  "A well-designed selector picks the highest-value content first.\n\n" +
  "The capital of France is Paris. Paris is known for the Eiffel Tower and the Louvre museum.\n\n" +
  "MongoDB Atlas offers a free tier called M0 with 512MB of storage for small demo projects.";

describe("selectContext", () => {
  it("returns an empty selection for an empty document without crashing", async () => {
    const result = await selectContext({ document: "", query: "anything", budget: 50 });
    expect(result.chunks).toEqual([]);
    expect(result.selected).toEqual([]);
  });

  it("never selects more tokens than the budget allows", async () => {
    const result = await selectContext({
      document: DOC,
      query: "How does token budgeting work?",
      budget: 40,
      chunkTokens: 20,
    });
    expect(result.totalTokens).toBeLessThanOrEqual(40);
  });

  it("ranks the most relevant chunk to the query above irrelevant ones", async () => {
    const result = await selectContext({
      document: DOC,
      query: "How does token budgeting work in context engineering?",
      budget: 200,
      chunkTokens: 20,
    });
    const sortedBySim = [...result.chunks].sort((a, b) => b.similarity - a.similarity);
    // The top-ranked chunk should be about tokens/budgets, not Paris or MongoDB.
    expect(sortedBySim[0].text.toLowerCase()).toMatch(/token|budget|context/);
  });

  it("'never' override excludes a chunk even if it's highly relevant", async () => {
    const first = await selectContext({
      document: DOC,
      query: "How does token budgeting work?",
      budget: 200,
      chunkTokens: 20,
    });
    const topChunkIndex = [...first.chunks].sort((a, b) => b.similarity - a.similarity)[0].index;

    const withOverride = await selectContext({
      document: DOC,
      query: "How does token budgeting work?",
      budget: 200,
      chunkTokens: 20,
      overrides: [{ index: topChunkIndex, tier: "never" }],
    });
    const excludedChunk = withOverride.chunks.find((c) => c.index === topChunkIndex);
    expect(excludedChunk.included).toBe(false);
  });

  it("'always' override force-includes a chunk regardless of relevance", async () => {
    const result = await selectContext({
      document: DOC,
      query: "How does token budgeting work?",
      budget: 200,
      chunkTokens: 20,
      overrides: [{ index: 0, tier: "always" }],
    });
    const forcedChunk = result.chunks.find((c) => c.index === 0);
    expect(forcedChunk.included).toBe(true);
    expect(forcedChunk.tier).toBe("always");
  });

  it("selected chunks are a subset of all chunks, and all included ones are marked included", async () => {
    const result = await selectContext({
      document: DOC,
      query: "test query",
      budget: 60,
      chunkTokens: 20,
    });
    const includedIndexes = result.chunks.filter((c) => c.included).map((c) => c.index);
    const selectedIndexes = result.selected.map((c) => c.index);
    expect(selectedIndexes.sort()).toEqual(includedIndexes.sort());
  });
});

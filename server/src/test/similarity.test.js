import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "../services/similarity.js";
import { buildTfidfVectors } from "../services/tfidf.js";

describe("cosineSimilarity", () => {
  it("identical dense vectors have similarity 1", () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it("orthogonal dense vectors have similarity 0", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it("opposite dense vectors have similarity -1", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
  });

  it("handles zero vectors without dividing by zero (NaN)", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it("works identically for sparse Map vectors", () => {
    const a = new Map([["cat", 1], ["dog", 2]]);
    const b = new Map([["cat", 1], ["dog", 2]]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });

  it("sparse vectors with no overlapping terms have similarity 0", () => {
    const a = new Map([["cat", 1]]);
    const b = new Map([["dog", 1]]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("sparse vectors work regardless of which side is smaller (order independence)", () => {
    const small = new Map([["a", 1]]);
    const large = new Map([["a", 1], ["b", 2], ["c", 3]]);
    expect(cosineSimilarity(small, large)).toBeCloseTo(cosineSimilarity(large, small), 10);
  });
});

describe("buildTfidfVectors", () => {
  it("a term appearing in every document gets a lower IDF-driven weight than a rare term", () => {
    // Isolate the IDF effect specifically: "common" and "rare" both appear
    // exactly once in doc 1, so term-frequency is equal and only the
    // across-corpus rarity differs — otherwise a repeated common word's
    // higher term-frequency can legitimately outweigh its lower IDF, which
    // is correct TF-IDF behavior, not something to assert against.
    const corpus = [
      "common rare",
      "common apple",
      "common banana",
    ];
    const vectors = buildTfidfVectors(corpus);
    const commonWeight = vectors[0].get("common"); // appears in all 3 docs
    const rareWeight = vectors[0].get("rare"); // appears in only 1 doc
    expect(rareWeight).toBeGreaterThan(commonWeight);
  });

  it("identical documents produce identical vectors", () => {
    const corpus = ["hello world foo", "hello world foo", "completely different text here"];
    const vectors = buildTfidfVectors(corpus);
    expect(vectors[0]).toEqual(vectors[1]);
  });

  it("cosine similarity of near-duplicate exact-wording sentences is very high", () => {
    const corpus = [
      "the quick brown fox jumps over the lazy dog",
      "the quick brown fox jumps over the lazy dog",
      "completely unrelated content about spreadsheets and finance",
    ];
    const vectors = buildTfidfVectors(corpus);
    const dupSim = cosineSimilarity(vectors[0], vectors[1]);
    const unrelatedSim = cosineSimilarity(vectors[0], vectors[2]);
    expect(dupSim).toBeGreaterThan(0.99);
    expect(dupSim).toBeGreaterThan(unrelatedSim);
  });
});

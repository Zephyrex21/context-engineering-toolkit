import { describe, it, expect } from "vitest";
import { countTokens, countTokensAllModels, SUPPORTED_MODELS } from "../services/tokenizer.js";

describe("tokenizer", () => {
  it("counts tokens for a known string using the real GPT-4 encoder", () => {
    const result = countTokens("Hello world, this is a test.", "gpt-4");
    expect(result.count).toBeGreaterThan(0);
    expect(result.exact).toBe(true);
    expect(result.model).toBe("gpt-4");
  });

  it("returns a higher count for longer text than shorter text", () => {
    const short = countTokens("Hello.", "gpt-4").count;
    const long = countTokens("Hello, this is a much longer sentence with many more words in it.", "gpt-4").count;
    expect(long).toBeGreaterThan(short);
  });

  it("marks non-OpenAI models as approximate, not exact", () => {
    const result = countTokens("test text", "claude-3-5-sonnet");
    expect(result.exact).toBe(false);
  });

  it("throws a clear error for an unsupported model", () => {
    expect(() => countTokens("text", "not-a-real-model")).toThrow(/Unsupported model/);
  });

  it("empty string counts as zero tokens, not an error", () => {
    expect(countTokens("", "gpt-4").count).toBe(0);
  });

  it("countTokensAllModels returns an entry for every supported model", () => {
    const results = countTokensAllModels("Some sample text to count.");
    expect(Object.keys(results).sort()).toEqual([...SUPPORTED_MODELS].sort());
    for (const model of SUPPORTED_MODELS) {
      expect(results[model].count).toBeGreaterThan(0);
    }
  });

  it("gpt-4o and gpt-4 can produce different counts (different encodings)", () => {
    // Not guaranteed different for every string, but the encoders ARE different —
    // verify at least that both resolve without throwing and are internally consistent.
    const a = countTokens("A test string with some unusual tokens: 🚀 émoji café.", "gpt-4o");
    const b = countTokens("A test string with some unusual tokens: 🚀 émoji café.", "gpt-4");
    expect(a.count).toBeGreaterThan(0);
    expect(b.count).toBeGreaterThan(0);
  });
});

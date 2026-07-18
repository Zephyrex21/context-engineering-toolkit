// $ per 1M tokens, published list pricing as of July 2026. Used only to
// ESTIMATE cost savings for the demo — this is not real billing, since the
// free tier this whole project runs on doesn't charge per token at all.
const PRICING = {
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
};

export function estimateCost(model, inputTokens, outputTokens) {
  const rates = PRICING[model];
  if (!rates) return null;
  const cost = (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
  return Math.round(cost * 1_000_000) / 1_000_000; // micro-dollar precision
}

export function getPricingTable() {
  return PRICING;
}

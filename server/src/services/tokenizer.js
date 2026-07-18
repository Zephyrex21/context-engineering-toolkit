import { getEncoding } from "js-tiktoken";

// cl100k_base covers GPT-3.5/GPT-4-family. o200k_base covers GPT-4o-family.
// Both are exact. We lazy-load + cache encoders since building one has a
// real cost (parsing the BPE rank file) and every route reuses them.
const encoderCache = new Map();

function getEncoder(encodingName) {
  if (!encoderCache.has(encodingName)) {
    encoderCache.set(encodingName, getEncoding(encodingName));
  }
  return encoderCache.get(encodingName);
}

// Model -> encoding map. Anthropic doesn't publish a BPE table, so Claude
// counts are a calibrated approximation, not exact — always labeled as such
// in the API response so the frontend can be honest about it.
const MODEL_CONFIG = {
  "gpt-4o": { encoding: "o200k_base", exact: true },
  "gpt-4": { encoding: "cl100k_base", exact: true },
  "gpt-3.5-turbo": { encoding: "cl100k_base", exact: true },
  "gemini-1.5-flash": { encoding: "cl100k_base", exact: false },
  "gemini-1.5-pro": { encoding: "cl100k_base", exact: false },
  "claude-3-5-sonnet": { encoding: "cl100k_base", exact: false, factor: 1.0 },
  "claude-3-5-haiku": { encoding: "cl100k_base", exact: false, factor: 1.0 },
};

export const SUPPORTED_MODELS = Object.keys(MODEL_CONFIG);

/**
 * Count tokens for a given text + model.
 * Returns { count, exact, model } — `exact: false` means it's a cl100k_base
 * approximation (close enough for budgeting, not billing-accurate).
 */
export function countTokens(text, model = "gpt-4") {
  const config = MODEL_CONFIG[model];
  if (!config) {
    throw new Error(
      `Unsupported model "${model}". Supported: ${SUPPORTED_MODELS.join(", ")}`
    );
  }
  const encoder = getEncoder(config.encoding);
  const tokens = encoder.encode(text ?? "");
  const count = Math.round(tokens.length * (config.factor ?? 1.0));
  return { count, exact: config.exact, model };
}

/**
 * Count tokens across every supported model in one pass — powers the
 * multi-model comparison view without the frontend firing N requests.
 */
export function countTokensAllModels(text) {
  return Object.fromEntries(
    SUPPORTED_MODELS.map((model) => [model, countTokens(text, model)])
  );
}

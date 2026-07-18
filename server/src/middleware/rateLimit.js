import rateLimit from "express-rate-limit";

// Basic sanity guard on everything — generous, mostly a DOS backstop since
// tokens/context/compress cost nothing but CPU.
export const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: Number(process.env.RATE_LIMIT_GENERAL_PER_MIN) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Slow down a little and try again." },
});

// Stricter guard specifically on routes that spend real LLM quota
// (summarize, evaluate, pipeline) — this is what actually protects a
// single free-tier key from being exhausted by one visitor on a public
// demo. Deliberately per-IP, not global, so one heavy user doesn't lock
// everyone else out.
export const llmLimiter = rateLimit({
  windowMs: 5 * 60_000,
  limit: Number(process.env.RATE_LIMIT_LLM_PER_5MIN) || 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "You've hit this demo's per-visitor limit for LLM-backed requests. Wait a few minutes, or use your own API key (see Settings) to bypass this limit entirely.",
  },
});

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 20_000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  // Same fix as embeddings.js's withTimeout: without this, a real (slow,
  // possibly-flaky) network call that loses the race and later fails on its
  // own crashes the whole process via an unhandled rejection on Node 15+.
  promise.catch(() => {});
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries once on 429 with a short backoff + jitter — free tiers are rate
 * limited by the minute, not banned, so a single retry after a beat is
 * usually enough for interactive (non-batch) use. Anything else throws.
 */
async function withRateLimitRetry(fn, { retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (err.status === 429 && attempt < retries) {
        const wait = 1500 + Math.random() * 1000;
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const res = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }),
    LLM_TIMEOUT_MS,
    "Gemini request"
  );

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    const err = new Error(`Gemini API error (${res.status}): ${bodyText.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("Gemini returned an empty response.");
  return text.trim();
}

async function callGroq(prompt, apiKey) {
  const res = await withTimeout(
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    }),
    LLM_TIMEOUT_MS,
    "Groq request"
  );

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    const err = new Error(`Groq API error (${res.status}): ${bodyText.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Groq returned an empty response.");
  return text.trim();
}

/**
 * Resolves which provider to use: explicit preference if its key is
 * present, otherwise whichever of GEMINI_API_KEY / GROQ_API_KEY is set
 * (Gemini first), otherwise null — callers must handle null explicitly
 * rather than crash, same graceful-degradation pattern as Mongo/embeddings.
 */
export function getAvailableProvider(preferred) {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  if (preferred === "gemini" && hasGemini) return "gemini";
  if (preferred === "groq" && hasGroq) return "groq";
  if (hasGemini) return "gemini";
  if (hasGroq) return "groq";
  return null;
}

export async function callLLM(prompt, { provider, apiKey } = {}) {
  // Bring-your-own-key: if the caller supplied their own key, use it
  // directly — this never touches process.env and is never logged, so a
  // visitor's key only ever exists for the lifetime of this one request.
  if (apiKey) {
    const resolvedProvider = provider === "groq" ? "groq" : "gemini";
    const text =
      resolvedProvider === "gemini"
        ? await withRateLimitRetry(() => callGemini(prompt, apiKey))
        : await withRateLimitRetry(() => callGroq(prompt, apiKey));
    return {
      text,
      provider: resolvedProvider,
      model: resolvedProvider === "gemini" ? GEMINI_MODEL : GROQ_MODEL,
    };
  }

  const resolved = getAvailableProvider(provider);
  if (!resolved) {
    const err = new Error(
      "No LLM configured. Add GEMINI_API_KEY or GROQ_API_KEY to server/.env, or use your own key via Settings — both have free tiers with no credit card required."
    );
    err.code = "NO_LLM_CONFIGURED";
    throw err;
  }

  if (resolved === "gemini") {
    const text = await withRateLimitRetry(() => callGemini(prompt, process.env.GEMINI_API_KEY));
    return { text, provider: "gemini", model: GEMINI_MODEL };
  }

  const text = await withRateLimitRetry(() => callGroq(prompt, process.env.GROQ_API_KEY));
  return { text, provider: "groq", model: GROQ_MODEL };
}

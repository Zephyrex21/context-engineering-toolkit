import { buildTfidfVectors } from "./tfidf.js";

let extractorPromise = null;
let mode = null; // "transformer" | "tfidf" | null (not yet resolved)

// One-time model download is ~90MB. Generous default for a real connection,
// but bounded so an unreachable host (offline dev box, locked-down network)
// fails open to TF-IDF instead of hanging every request that touches
// embeddings. Tune via env if you're on a slow link.
const LOAD_TIMEOUT_MS = Number(process.env.EMBEDDING_LOAD_TIMEOUT_MS) || 30_000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  // Promise.race doesn't cancel the loser — if `promise` loses the race and
  // later rejects on its own (a real, slow network call that eventually
  // fails, which is exactly the scenario mocked tests can't simulate), that
  // rejection has no handler attached to IT specifically and becomes an
  // "unhandled rejection" — which crashes the whole Node process on
  // Node 15+. This no-op catch prevents that regardless of which promise
  // wins the race.
  promise.catch(() => {});
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      try {
        const { pipeline } = await import("@xenova/transformers");
        // Downloads once, cached locally after that, in an environment with
        // internet access. If it's unreachable or too slow — offline, or a
        // sandboxed network without huggingface.co allowed — this times out
        // and we fall back to TF-IDF below instead of hanging forever.
        const extractor = await withTimeout(
          pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true }),
          LOAD_TIMEOUT_MS,
          "transformer model load"
        );
        mode = "transformer";
        return extractor;
      } catch (err) {
        console.error(
          "[embeddings] local transformer model unavailable, falling back to TF-IDF:",
          err.message
        );
        mode = "tfidf";
        return null;
      }
    })();
  }
  return extractorPromise;
}

/** Call once at server boot so the model is warm before the first real request. */
export async function warmupEmbeddings() {
  await getExtractor();
  console.log(`[embeddings] mode = ${mode}`);
}

export function getEmbeddingMode() {
  return mode ?? "loading";
}

/**
 * Embeds a batch of texts. Returns dense vectors (Array<number>) in
 * transformer mode, or sparse Maps in tfidf fallback mode — cosineSimilarity
 * handles both transparently.
 */
export async function embedTexts(texts) {
  const extractor = await getExtractor();

  if (extractor) {
    const output = await extractor(texts, { pooling: "mean", normalize: true });
    return { vectors: output.tolist(), mode: "transformer" };
  }

  return { vectors: buildTfidfVectors(texts), mode: "tfidf" };
}

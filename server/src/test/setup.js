// Keeps the test suite fast and deterministic whether or not this
// environment can reach huggingface.co (CI runners often can't, or
// shouldn't have to, just to run unit tests) — falls back to TF-IDF
// quickly instead of waiting out the full production timeout.
process.env.EMBEDDING_LOAD_TIMEOUT_MS = "3000";

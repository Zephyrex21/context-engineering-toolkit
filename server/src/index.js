import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectMongo } from "./db/mongo.js";
import { healthRouter } from "./routes/health.js";
import { tokensRouter } from "./routes/tokens.js";
import { contextRouter } from "./routes/context.js";
import { compressRouter } from "./routes/compress.js";
import { summarizeRouter } from "./routes/summarize.js";
import { evaluateRouter } from "./routes/evaluate.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { generalLimiter, llmLimiter } from "./middleware/rateLimit.js";
import { warmupEmbeddings } from "./services/embeddings.js";

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Defense in depth: the root cause of one known crash pattern (an orphaned
// promise from a Promise.race timeout rejecting later) is fixed at the
// source in embeddings.js/llmClient.js, but this is a demo server with no
// process supervisor to auto-restart it — `node --watch` only restarts on
// file changes, not crashes. Prioritizing staying alive and visible in the
// logs over strict "exit on anything unexpected" production purity.
process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandled promise rejection (continuing):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[server] uncaught exception (continuing):", err);
});

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "2mb" }));
app.use("/api", generalLimiter);

app.use("/api/health", healthRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/context", contextRouter);
app.use("/api/compress", compressRouter);
app.use("/api/summarize", llmLimiter, summarizeRouter);
app.use("/api/evaluate", llmLimiter, evaluateRouter);
app.use("/api/pipeline", llmLimiter, pipelineRouter);
app.use("/api/dashboard", dashboardRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `No route: ${req.method} ${req.path}` });
});

// Central error handler — never leak a raw stack trace to a public demo
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await connectMongo(); // no-ops gracefully if MONGO_URI is unset
  warmupEmbeddings(); // intentionally not awaited — loads in background,
  // first /api/context/select call will wait on the same cached promise
  // if it arrives before warmup finishes.
  app.listen(PORT, () => {
    console.log(`[server] listening on :${PORT} (client origin: ${CLIENT_ORIGIN})`);
  });
}

start();

import { useEffect, useMemo, useState } from "react";
import { runPipeline } from "../api/pipeline.js";
import { fetchEvaluateStatus } from "../api/evaluate.js";
import { useApiKey } from "../context/ApiKeyContext.jsx";
import { AnimatedNumber } from "./AnimatedNumber.jsx";
import { StageIcon } from "./StageIcon.jsx";
import { ChunkList } from "./ChunkList.jsx";
import { SentenceList } from "./SentenceList.jsx";

const STAGES = [
  { id: "select", label: "Select", icon: "scissors" },
  { id: "compress", label: "Compress", icon: "funnel" },
  { id: "summarize", label: "Summarize", icon: "gear" },
  { id: "evaluate", label: "Evaluate", icon: "gauge" },
];

const REVEAL_DELAYS_MS = [0, 900, 1800, 2700]; // when each stage index becomes visible
const FULLY_DONE_DELAY_MS = 3600;

const SAMPLE_DOCUMENT = `Context engineering is the discipline of assembling exactly what a model needs to see before it answers. It goes beyond prompt engineering by treating the entire information architecture as the design surface, spanning retrieval, memory, and compression.

Token budgets matter because every model has a finite context window. Overflowing that window forces truncation, which can silently drop the most important facts. A well-designed selector picks the highest-value content first, before compression ever needs to run.

Compression is not the same as summarization. Extractive compression keeps original sentences verbatim, just fewer of them — fast, free, and with zero risk of factual drift since nothing is rewritten. Abstractive summarization rewrites content in new words, which can compress much further but carries a small real risk of the model subtly changing a number or a name.

The capital of France is Paris. Paris is known for the Eiffel Tower, completed in 1889, and the Louvre museum, the world's most-visited art museum.

MongoDB Atlas offers a free tier called M0 with 512MB of storage, which is enough for small demo projects. It runs on shared infrastructure and doesn't require a credit card to start.

Node.js uses a single-threaded event loop to handle concurrent operations without spawning a thread per connection, which is part of why it's popular for I/O-heavy backends.

React's virtual DOM diffing algorithm compares the new render tree against the previous one to compute a minimal set of real DOM mutations, avoiding unnecessary work on the actual page.`;

const SAMPLE_QUERY = "What's the difference between extractive compression and abstractive summarization?";

function tokensAtStage(result, stageIndex) {
  if (!result) return 0;
  if (stageIndex < 0) return result.originalTokens;
  if (stageIndex === 0) return result.stages.select.tokensAfter;
  if (stageIndex === 1) return result.stages.compress.tokensAfter;
  // stage 2 (summarize) and 3 (evaluate) both settle on the same final value —
  // evaluate doesn't change the context, it just measures it.
  const s = result.stages.summarize;
  if (s.triggered && s.used) return s.summaryTokens;
  return result.stages.compress.tokensAfter;
}

function stageStatus(result, stageId, index, revealIndex) {
  if (index > revealIndex) return "pending";
  if (stageId === "summarize") {
    const s = result.stages.summarize;
    if (s.error) return "error";
    if (s.triggered && s.used) return "used";
    if (s.triggered && !s.used) return "tried";
    return "skipped";
  }
  if (stageId === "evaluate") {
    const e = result.stages.evaluate;
    if (e.error) return "error";
    return e.skipped ? "skipped" : "used";
  }
  return "used"; // select + compress always do real, visible work
}

const STATUS_STYLES = {
  pending: "border-line text-mute",
  used: "border-safe text-safe bg-safe/10",
  tried: "border-gauge text-gauge bg-gauge/10",
  skipped: "border-line text-mute bg-line/30",
  error: "border-danger text-danger bg-danger/10",
};

const STATUS_LABEL = {
  pending: "pending",
  used: "done",
  tried: "tried, not used",
  skipped: "skipped",
  error: "error",
};

export function PipelineVisualizer() {
  const { apiKey, provider: userProvider, hasKey } = useApiKey();
  const [serverLlmAvailable, setServerLlmAvailable] = useState(null);

  const [document, setDocument] = useState(SAMPLE_DOCUMENT);
  const [query, setQuery] = useState(SAMPLE_QUERY);
  const [budget, setBudget] = useState(70);

  const [status, setStatus] = useState("idle"); // idle | running | error
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [activeDetail, setActiveDetail] = useState(null);

  useEffect(() => {
    fetchEvaluateStatus()
      .then((s) => setServerLlmAvailable(s.available))
      .catch(() => setServerLlmAvailable(false));
  }, []);

  const llmAvailable = serverLlmAvailable || hasKey;

  useEffect(() => {
    if (!result) return undefined;
    const timers = REVEAL_DELAYS_MS.map((delay, i) => setTimeout(() => setRevealIndex(i), delay));
    timers.push(setTimeout(() => setRevealIndex(4), FULLY_DONE_DELAY_MS));
    return () => timers.forEach(clearTimeout);
  }, [result]);

  async function run() {
    setStatus("running");
    setErrorMsg("");
    setResult(null);
    setRevealIndex(-1);
    setActiveDetail(null);
    try {
      const r = await runPipeline({ document, query, budget, apiKey, provider: userProvider });
      setResult(r);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  const liveTokens = useMemo(() => tokensAtStage(result, revealIndex), [result, revealIndex]);
  const startTokens = result ? result.originalTokens : 0;
  const fullyDone = revealIndex >= 4;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Document</label>
          <textarea
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full resize-y rounded-xl bg-surface border border-line px-4 py-3 text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60 focus:border-gauge/60"
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Question</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl bg-surface border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Final budget (tokens)</label>
            <input
              type="number"
              min={10}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
            />
          </div>
          <button
            type="button"
            onClick={run}
            disabled={status === "running"}
            className="w-full rounded-xl bg-gauge text-white text-sm font-medium py-2.5 shadow-sm hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50"
          >
            {status === "running" ? "Running pipeline..." : "Run Pipeline"}
          </button>
          {!llmAvailable && (
            <span className="text-[11px] text-mute text-center">
              no LLM configured — summarize/evaluate stages will show as skipped
            </span>
          )}
        </div>
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {result && (
        <>
          {/* Live token readout */}
          <div className="rounded-2xl bg-surface border border-line p-6 shadow-card dark:shadow-card-dark flex flex-col items-center gap-2">
            <span className="text-[11px] tracking-[0.18em] text-mute uppercase">
              {fullyDone ? "Final size" : "Watching it shrink..."}
            </span>
            <div className="flex items-baseline gap-3">
              <AnimatedNumber value={liveTokens} className="text-5xl font-mono text-gauge tabular" />
              <span className="text-lg text-mute font-mono">
                / <AnimatedNumber value={startTokens} durationMs={1} className="tabular" /> tok
              </span>
            </div>
            {fullyDone && (
              <span className="text-[12px] text-safe font-mono">
                {result.overallReductionPercent}% reduction
              </span>
            )}
          </div>

          {/* Stage tracker */}
          <div className="flex items-center gap-2">
            {STAGES.map((stage, i) => {
              const st = i <= revealIndex ? stageStatus(result, stage.id, i, revealIndex) : "pending";
              const isRevealed = i <= revealIndex;
              return (
                <div key={stage.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    disabled={!isRevealed}
                    onClick={() => setActiveDetail(activeDetail === stage.id ? null : stage.id)}
                    className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-colors ${
                      STATUS_STYLES[st]
                    } ${isRevealed ? "cursor-pointer hover:brightness-125" : "cursor-default"} ${
                      i === revealIndex && !fullyDone ? "animate-pulse" : ""
                    }`}
                  >
                    <StageIcon type={stage.icon} />
                    <span className="text-[11px] font-mono uppercase tracking-wide">{stage.label}</span>
                    <span className="text-[10px] font-mono opacity-80">{STATUS_LABEL[st]}</span>
                  </button>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`w-4 h-px shrink-0 mx-1 ${i < revealIndex ? "bg-safe" : "bg-line"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage detail panels */}
          {activeDetail === "select" && revealIndex >= 0 && (
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-3">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">
                Select — {result.stages.select.selectedCount} of {result.stages.select.chunkCount} chunks
                kept ({result.stages.select.embeddingMode} mode)
              </span>
              <ChunkList
                chunks={result.stages.select.chunks}
                maxSimilarity={Math.max(...result.stages.select.chunks.map((c) => c.similarity), 0.001)}
              />
            </div>
          )}

          {activeDetail === "compress" && revealIndex >= 1 && (
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-3">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">
                Compress — {result.stages.compress.compressionRatio}% reduction, meaning preserved{" "}
                {result.stages.compress.meaningPreserved ?? "—"}
              </span>
              <SentenceList
                sentences={result.stages.compress.sentences}
                maxScore={Math.max(
                  ...result.stages.compress.sentences.map((s) => s.score ?? 0),
                  0.001
                )}
              />
            </div>
          )}

          {activeDetail === "summarize" && revealIndex >= 2 && (
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-3">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Summarize</span>
              <p className="text-[13px] text-ink/80 leading-relaxed">{result.stages.summarize.reason}</p>
              {result.stages.summarize.triggered && result.stages.summarize.summary && (
                <div className="rounded bg-void border border-line p-3">
                  <span className="text-[10px] font-mono uppercase text-mute block mb-1.5">
                    LLM summary {result.stages.summarize.used ? "(used)" : "(not used)"}
                  </span>
                  <p className="text-[13px] text-ink/85 leading-relaxed">
                    {result.stages.summarize.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeDetail === "evaluate" && revealIndex >= 3 && (
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-3">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Evaluate</span>
              {result.stages.evaluate.skipped ? (
                <p className="text-[13px] text-mute leading-relaxed">
                  {result.stages.evaluate.reason || result.stages.evaluate.error}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded bg-void border border-line p-3 flex flex-col gap-2">
                    <span className="text-[10px] font-mono uppercase text-mute">
                      Raw context —{" "}
                      {result.stages.evaluate.scoring.method === "llm-judge"
                        ? `${result.stages.evaluate.scoring.raw}/10`
                        : result.stages.evaluate.scoring.raw?.toFixed(3)}
                    </span>
                    <p className="text-[13px] text-ink/80 leading-relaxed">
                      {result.stages.evaluate.raw.answer}
                    </p>
                  </div>
                  <div className="rounded bg-void border border-safe/40 p-3 flex flex-col gap-2">
                    <span className="text-[10px] font-mono uppercase text-safe">
                      Engineered context —{" "}
                      {result.stages.evaluate.scoring.method === "llm-judge"
                        ? `${result.stages.evaluate.scoring.engineered}/10`
                        : result.stages.evaluate.scoring.engineered?.toFixed(3)}
                    </span>
                    <p className="text-[13px] text-ink/80 leading-relaxed">
                      {result.stages.evaluate.engineered.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {fullyDone && (
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase block mb-2">
                Final engineered context
              </span>
              <p className="text-[13px] leading-relaxed text-ink/85">{result.finalContext}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

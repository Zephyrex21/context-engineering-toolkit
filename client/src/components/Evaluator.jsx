import { useEffect, useState } from "react";
import { fetchEvaluateStatus, compareContexts } from "../api/evaluate.js";
import { useApiKey } from "../context/ApiKeyContext.jsx";
import { NoLLMConfigured } from "./NoLLMConfigured.jsx";

const SAMPLE_QUERY = "What free tier does MongoDB Atlas offer, and how much storage does it include?";

const SAMPLE_RAW = `Context engineering is the discipline of assembling exactly what a model needs to see before it answers. It goes beyond prompt engineering by treating the entire information architecture as the design surface.

Token budgets matter because every model has a finite context window. Overflowing that window forces truncation, which can silently drop the most important facts.

The capital of France is Paris. Paris is known for the Eiffel Tower, completed in 1889, and the Louvre museum, the world's most-visited art museum.

Node.js uses a single-threaded event loop to handle concurrent operations without spawning a thread per connection, which is part of why it's popular for I/O-heavy backends.

MongoDB Atlas offers a free tier called M0 with 512MB of storage, which is enough for small demo projects. It runs on shared infrastructure and doesn't require a credit card to start.

React's virtual DOM diffing algorithm compares the new render tree against the previous one to compute a minimal set of real DOM mutations.`;

const SAMPLE_ENGINEERED = `MongoDB Atlas offers a free tier called M0 with 512MB of storage, which is enough for small demo projects. It runs on shared infrastructure and doesn't require a credit card to start.`;

function scoreLabel(scoring, side) {
  if (!scoring) return null;
  const value = scoring[side];
  if (value === null || value === undefined) return "—";
  return scoring.method === "llm-judge" ? `${value}/10` : value.toFixed(3);
}

function ResultCard({ title, data, score, scoreMethod, isWinner }) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 ${
        isWinner ? "border-safe bg-safe/5" : "border-line bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] tracking-[0.18em] text-mute uppercase">{title}</span>
        {isWinner && (
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-safe/20 text-safe">
            winner
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-mono tabular ${isWinner ? "text-safe" : "text-ink"}`}>
          {score}
        </span>
        <span className="text-[11px] text-mute">
          {scoreMethod === "llm-judge" ? "LLM-judge score" : "similarity to reference"}
        </span>
      </div>

      <p className="text-[13px] leading-relaxed text-ink/85 border-t border-line pt-3">
        {data.answer}
      </p>

      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-mute pt-2 border-t border-line">
        <div>
          <div className="text-mute/70">tokens in</div>
          <div className="text-ink/80 tabular">{data.tokensIn}</div>
        </div>
        <div>
          <div className="text-mute/70">latency</div>
          <div className="text-ink/80 tabular">{data.latencyMs}ms</div>
        </div>
        <div>
          <div className="text-mute/70">est. cost</div>
          <div className="text-ink/80 tabular">
            {data.costEstimate !== null ? `$${data.costEstimate.toFixed(6)}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Evaluator() {
  const { apiKey, provider: userProvider, hasKey } = useApiKey();
  const [serverAvailable, setServerAvailable] = useState(null);
  const [serverProvider, setServerProvider] = useState(null);

  const [query, setQuery] = useState(SAMPLE_QUERY);
  const [rawContext, setRawContext] = useState(SAMPLE_RAW);
  const [engineeredContext, setEngineeredContext] = useState(SAMPLE_ENGINEERED);
  const [referenceAnswer, setReferenceAnswer] = useState("");
  const [showReference, setShowReference] = useState(false);

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchEvaluateStatus()
      .then((s) => {
        setServerAvailable(s.available);
        setServerProvider(s.provider);
      })
      .catch(() => setServerAvailable(false));
  }, []);

  async function run() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await compareContexts({
        query,
        rawContext,
        engineeredContext,
        referenceAnswer: showReference ? referenceAnswer : undefined,
        apiKey,
        provider: userProvider,
      });
      setResult(r);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  if (serverAvailable === null) {
    return <p className="text-sm text-mute">Checking LLM availability...</p>;
  }
  const available = serverAvailable || hasKey;
  if (!available) {
    return <NoLLMConfigured />;
  }
  const activeProvider = hasKey ? userProvider : serverProvider;

  const rawWins = result && result.scoring.raw !== null && result.scoring.engineered !== null
    ? result.scoring.engineered > result.scoring.raw
      ? "engineered"
      : result.scoring.raw > result.scoring.engineered
      ? "raw"
      : "tie"
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-mute">
          Same question, two contexts, two real answers — this is what proves the rest of the toolkit is worth using.
        </span>
        <span className="text-[11px] font-mono text-mute">
          engine: {activeProvider} {hasKey && "(your key)"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Question</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.18em] text-mute uppercase">
            Raw context (unprocessed)
          </label>
          <textarea
            value={rawContext}
            onChange={(e) => setRawContext(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full resize-y rounded-xl bg-surface border border-line px-3 py-2 text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.18em] text-mute uppercase">
            Engineered context (selected & compressed)
          </label>
          <textarea
            value={engineeredContext}
            onChange={(e) => setEngineeredContext(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full resize-y rounded-xl bg-surface border border-line px-3 py-2 text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowReference((v) => !v)}
          className="text-[11px] font-mono text-mute hover:text-ink w-fit"
        >
          {showReference ? "− hide" : "+ add"} reference answer (optional, switches scoring to similarity mode)
        </button>
        {showReference && (
          <textarea
            value={referenceAnswer}
            onChange={(e) => setReferenceAnswer(e.target.value)}
            rows={2}
            placeholder="The ground-truth answer, if you know it..."
            className="w-full resize-y rounded-xl bg-surface border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
          />
        )}
      </div>

      <button
        type="button"
        onClick={run}
        disabled={status === "loading"}
        className="w-full rounded-xl bg-gauge text-white text-sm font-medium py-2.5 shadow-sm hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50"
      >
        {status === "loading" ? "Running comparison..." : "Compare"}
      </button>

      {status === "error" && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {result && status !== "error" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Tokens saved</span>
              <span className="text-2xl font-mono text-gauge tabular">{result.tokensSavedPercent}%</span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Tokens</span>
              <span className="text-2xl font-mono text-ink tabular">{result.tokensSaved}</span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Est. cost saved</span>
              <span className="text-2xl font-mono text-ink tabular">
                {result.costSaved !== null ? `$${result.costSaved.toFixed(6)}` : "—"}
              </span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Scoring</span>
              <span className="text-sm font-mono text-ink tabular pt-1.5">
                {result.scoring.method === "llm-judge" ? "LLM judge" : "reference sim"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ResultCard
              title="Raw context"
              data={result.raw}
              score={scoreLabel(result.scoring, "raw")}
              scoreMethod={result.scoring.method}
              isWinner={rawWins === "raw"}
            />
            <ResultCard
              title="Engineered context"
              data={result.engineered}
              score={scoreLabel(result.scoring, "engineered")}
              scoreMethod={result.scoring.method}
              isWinner={rawWins === "engineered"}
            />
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { selectContext, fetchContextStatus } from "../api/context.js";
import { BudgetBar } from "./BudgetBar.jsx";
import { ChunkList } from "./ChunkList.jsx";

const SAMPLE_DOC = `Context engineering is the discipline of assembling exactly what a model needs to see before it answers. It goes beyond prompt engineering by treating the entire information architecture as the design surface.

Token budgets matter because every model has a finite context window. Overflowing that window forces truncation, which can silently drop the most important facts. A well-designed selector picks the highest-value content first.

Compression is not the same as summarization. Extractive compression keeps original sentences verbatim, just fewer of them. Abstractive summarization rewrites content in new words, which risks introducing errors.

The capital of France is Paris. Paris is known for the Eiffel Tower and the Louvre museum.

MongoDB Atlas offers a free tier called M0 with 512MB of storage, which is enough for small demo projects.`;

export function ContextSelector() {
  const [document, setDocument] = useState(SAMPLE_DOC);
  const [query, setQuery] = useState("How does token budgeting work in context engineering?");
  const [budget, setBudget] = useState(80);
  const [chunkTokens, setChunkTokens] = useState(30);
  const [overrides, setOverrides] = useState({}); // index -> "always" | "never"

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");
  const [embeddingMode, setEmbeddingMode] = useState(null);

  useEffect(() => {
    fetchContextStatus()
      .then((s) => setEmbeddingMode(s.embeddingMode))
      .catch(() => setEmbeddingMode(null));
  }, []);

  async function runSelection(currentOverrides = overrides) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const overrideList = Object.entries(currentOverrides).map(([index, tier]) => ({
        index: Number(index),
        tier,
      }));
      const r = await selectContext({
        document,
        query,
        budget,
        chunkTokens,
        overrides: overrideList,
      });
      setResult(r);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  function handleSetTier(index, tier) {
    const next = { ...overrides };
    if (tier === null) {
      delete next[index];
    } else {
      next[index] = tier;
    }
    setOverrides(next);
    runSelection(next);
  }

  const maxSimilarity = useMemo(() => {
    if (!result) return 0;
    return Math.max(...result.chunks.map((c) => c.similarity), 0.001);
  }, [result]);

  return (
    <div className="flex flex-col gap-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Document</label>
          <textarea
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full resize-y rounded-xl bg-surface border border-line px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-gauge/60 focus:border-gauge/60"
            placeholder="Paste a document to chunk and search over..."
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Query</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl bg-surface border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
              placeholder="What do you want to know from it?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Budget</label>
              <input
                type="number"
                min={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Chunk size</label>
              <input
                type="number"
                min={10}
                value={chunkTokens}
                onChange={(e) => setChunkTokens(Number(e.target.value) || 0)}
                className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => runSelection()}
            disabled={status === "loading"}
            className="w-full rounded-xl bg-gauge text-white text-sm font-medium py-2.5 shadow-sm hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50"
          >
            {status === "loading" ? "Selecting..." : "Select Context"}
          </button>
          {embeddingMode && (
            <span className="text-[11px] font-mono text-mute text-center">
              engine: {embeddingMode === "transformer" ? "semantic (local model)" : "keyword (TF-IDF fallback)"}
            </span>
          )}
        </div>
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {result && status !== "error" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark">
              <BudgetBar used={result.totalTokens} limit={budget} />
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1.5 text-[12px] text-mute">
              <div className="flex justify-between">
                <span>Total chunks</span>
                <span className="font-mono text-ink/80">{result.chunkCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected</span>
                <span className="font-mono text-ink/80">{result.selected.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Reduction</span>
                <span className="font-mono text-ink/80">
                  {result.chunkCount > 0
                    ? `${Math.round((1 - result.selected.length / result.chunkCount) * 100)}%`
                    : "—"}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-mute leading-relaxed px-1">
              Tag a chunk <span className="text-safe font-mono">always</span> to force it in
              regardless of relevance, or <span className="text-danger font-mono">never</span> to
              exclude it — the rest fill the remaining budget by relevance and diversity (MMR).
            </p>
          </div>

          <div className="lg:col-span-2">
            <ChunkList chunks={result.chunks} maxSimilarity={maxSimilarity} onSetTier={handleSetTier} />
          </div>
        </div>
      )}
    </div>
  );
}

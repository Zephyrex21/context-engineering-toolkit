import { useMemo, useState } from "react";
import { compressText } from "../api/compress.js";
import { SentenceList } from "./SentenceList.jsx";

const SAMPLE_TEXT = `Context engineering is the discipline of assembling exactly what a model needs to see before it answers. Context engineering is the practice of assembling precisely what a model needs to see before it responds. It goes beyond prompt engineering by treating the entire information architecture as the design surface.

Token budgets matter because every model has a finite context window. Overflowing that window forces truncation, which can silently drop the most important facts. A well-designed selector picks the highest-value content first.

Compression is not the same as summarization. Extractive compression keeps original sentences verbatim, just fewer of them. Abstractive summarization rewrites content in new words, which risks introducing errors.

The capital of France is Paris. Paris is known for the Eiffel Tower and the Louvre museum.

MongoDB Atlas offers a free tier called M0 with 512MB of storage, which is enough for small demo projects.`;

function preservationColor(score) {
  if (score === null) return "text-mute";
  if (score >= 0.8) return "text-safe";
  if (score >= 0.5) return "text-gauge";
  return "text-danger";
}

export function Compressor() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState(60);

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function runCompress() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await compressText({ text, budget, query });
      setResult(r);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  const maxScore = useMemo(() => {
    if (!result) return 0;
    const scores = result.sentences.map((s) => s.score).filter((s) => s !== null);
    return scores.length ? Math.max(...scores) : 0;
  }, [result]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full resize-y rounded-xl bg-surface border border-line px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-gauge/60 focus:border-gauge/60"
            placeholder="Paste noisy or verbose text to compress..."
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Query <span className="normal-case text-mute/70">(optional)</span>
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl bg-surface border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
              placeholder="Leave blank for generic importance scoring, or focus on a question..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Budget (tokens)</label>
            <input
              type="number"
              min={5}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
            />
          </div>
          <button
            type="button"
            onClick={runCompress}
            disabled={status === "loading"}
            className="w-full rounded-xl bg-gauge text-white text-sm font-medium py-2.5 shadow-sm hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50"
          >
            {status === "loading" ? "Compressing..." : "Compress"}
          </button>
          <span className="text-[11px] text-mute text-center">
            {query.trim() ? "scoring: relevance to query" : "scoring: generic importance (centrality)"}
          </span>
        </div>
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {result && status !== "error" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Reduction</span>
              <span className="text-2xl font-mono text-gauge tabular">{result.compressionRatio}%</span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Tokens</span>
              <span className="text-2xl font-mono text-ink tabular">
                {result.compressedTokens}
                <span className="text-mute text-sm"> / {result.originalTokens}</span>
              </span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Meaning preserved</span>
              <span className={`text-2xl font-mono tabular ${preservationColor(result.meaningPreserved)}`}>
                {result.meaningPreserved !== null ? result.meaningPreserved.toFixed(2) : "—"}
              </span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Deduped</span>
              <span className="text-2xl font-mono text-ink tabular">{result.dedupedCount}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark">
            <span className="text-[11px] tracking-[0.18em] text-mute uppercase block mb-2">
              Compressed output
            </span>
            <p className="text-[14px] leading-relaxed text-ink/90">{result.compressedText}</p>
          </div>

          <div>
            <span className="text-[11px] tracking-[0.18em] text-mute uppercase block mb-3">
              Sentence breakdown
            </span>
            <SentenceList sentences={result.sentences} maxScore={maxScore} />
          </div>
        </>
      )}
    </div>
  );
}

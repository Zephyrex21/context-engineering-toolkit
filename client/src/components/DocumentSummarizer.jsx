import { useState } from "react";
import { summarizeDocument } from "../api/summarize.js";

const SAMPLE_DOC = `Context engineering is the discipline of assembling exactly what a model needs to see before it answers. It goes beyond prompt engineering by treating the entire information architecture as the design surface. Retrieval, memory, and compression all live inside this discipline, and none of them matter if the model's context window overflows before the important content ever arrives.

Extractive compression — the kind the Compressor tool uses — works by keeping original sentences verbatim and simply choosing fewer of them. It's fast, free, and has zero risk of factual drift, because nothing is rewritten. But it has a hard ceiling: if a document is dense with information spread evenly across every sentence, there's no clever selection that gets you much further than throwing away detail wholesale.

That's where abstractive summarization earns its cost. An LLM can compress ten sentences carrying one idea each into two sentences that still carry all ten ideas, because it's rewriting rather than selecting. The tradeoff is real: it costs a real API call, it takes real latency, and there's a real (if usually small) risk of the model subtly changing a number or a name in the rewrite. That's exactly why this tool measures a meaning-preserved score after the fact instead of just trusting the summary blindly.

A map-reduce structure handles documents too long for a single LLM call to summarize well in one pass. The map stage splits the document into chunks and summarizes each independently, in parallel-friendly fashion. The reduce stage then combines those partial summaries into one final summary, trimming redundancy that surfaces when several chunks touch on related ideas. This mirrors, at a much smaller scale, the same map-reduce pattern from distributed data processing.`;

function preservationColor(score) {
  if (score === null) return "text-mute";
  if (score >= 0.8) return "text-safe";
  if (score >= 0.5) return "text-gauge";
  return "text-danger";
}

export function DocumentSummarizer({ apiKey, provider }) {
  const [text, setText] = useState(SAMPLE_DOC);
  const [budget, setBudget] = useState(120);
  const [chunkTokens, setChunkTokens] = useState(150);

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function run() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await summarizeDocument({ text, budget, chunkTokens, apiKey, provider });
      setResult(r);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label className="text-[11px] tracking-[0.18em] text-mute uppercase">Document</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            spellCheck={false}
            className="w-full resize-y rounded-xl bg-surface border border-line px-4 py-3 text-[14px] leading-relaxed text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-gauge/60 focus:border-gauge/60"
            placeholder="Paste a long document to summarize..."
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Target budget (tokens)
            </label>
            <input
              type="number"
              min={10}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Map chunk size (tokens)
            </label>
            <input
              type="number"
              min={50}
              value={chunkTokens}
              onChange={(e) => setChunkTokens(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
            />
          </div>
          <button
            type="button"
            onClick={run}
            disabled={status === "loading"}
            className="w-full rounded-xl bg-gauge text-white text-sm font-medium py-2.5 shadow-sm hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50"
          >
            {status === "loading" ? "Summarizing..." : "Summarize"}
          </button>
          <span className="text-[11px] text-mute text-center">
            skips the LLM entirely if the doc already fits the budget
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Reduction</span>
              <span className="text-2xl font-mono text-gauge tabular">{result.compressionRatio}%</span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Tokens</span>
              <span className="text-2xl font-mono text-ink tabular">
                {result.summaryTokens}
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
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Map chunks</span>
              <span className="text-2xl font-mono text-ink tabular">{result.mapChunkCount}</span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Provider</span>
              <span className="text-sm font-mono text-ink tabular pt-1.5">
                {result.provider ?? "skipped"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark">
            <span className="text-[11px] tracking-[0.18em] text-mute uppercase block mb-2">
              Summary
            </span>
            <p className="text-[14px] leading-relaxed text-ink/90 whitespace-pre-wrap">
              {result.summary}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

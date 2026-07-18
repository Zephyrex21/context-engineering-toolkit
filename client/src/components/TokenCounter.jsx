import { useEffect, useMemo, useState } from "react";
import { countTokens, countTokensAllModels } from "../api/tokens.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { BudgetBar } from "./BudgetBar.jsx";

const MODEL_LABELS = {
  "gpt-4o": "GPT-4o",
  "gpt-4": "GPT-4",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "gemini-1.5-flash": "Gemini 1.5 Flash",
  "gemini-1.5-pro": "Gemini 1.5 Pro",
  "claude-3-5-sonnet": "Claude 3.5 Sonnet",
  "claude-3-5-haiku": "Claude 3.5 Haiku",
};

const SAMPLE_TEXT = `Context engineering is the discipline of assembling what a model sees before it answers — not just the prompt, but the entire information architecture around it. Paste any text here to see exactly how many tokens it costs across different models, and set a budget to see how close you are to the edge.`;

export function TokenCounter() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [model, setModel] = useState("gpt-4");
  const [budget, setBudget] = useState(500);
  const [compareMode, setCompareMode] = useState(false);

  const [result, setResult] = useState(null);
  const [compareResults, setCompareResults] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");

  const debouncedText = useDebouncedValue(text, 300);
  const charCount = text.length;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      setErrorMsg("");
      try {
        if (compareMode) {
          const { results } = await countTokensAllModels({
            text: debouncedText,
            budget: budget || undefined,
          });
          if (!cancelled) {
            setCompareResults(results);
            setStatus("idle");
          }
        } else {
          const r = await countTokens({
            text: debouncedText,
            model,
            budget: budget || undefined,
          });
          if (!cancelled) {
            setResult(r);
            setStatus("idle");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message);
          setStatus("error");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedText, model, budget, compareMode]);

  const sortedCompareEntries = useMemo(() => {
    if (!compareResults) return [];
    return Object.entries(compareResults).sort((a, b) => a[1].count - b[1].count);
  }, [compareResults]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Input panel */}
      <div className="lg:col-span-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] tracking-[0.18em] text-mute uppercase">
            Input Text
          </label>
          <span className="text-[11px] font-mono text-mute tabular">
            {charCount.toLocaleString()} chars
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full resize-y rounded-xl bg-surface border border-line px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-gauge/60 focus:border-gauge/60"
          placeholder="Paste text, a document, or a prompt to measure it..."
        />
      </div>

      {/* Controls + readout panel */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Compare all models
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={compareMode}
              onClick={() => setCompareMode((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                compareMode ? "bg-gauge" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-void transition-transform ${
                  compareMode ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {!compareMode && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="model-select" className="text-[11px] tracking-[0.18em] text-mute uppercase">
                Model
              </label>
              <select
                id="model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl bg-void border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
              >
                {Object.entries(MODEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {result && !result.exact && (
                <span className="text-[11px] text-mute">
                  Approximated via cl100k_base — this provider doesn't publish a tokenizer.
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="budget-input" className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Budget (tokens)
            </label>
            <input
              id="budget-input"
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-void border border-line px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
            />
          </div>
        </div>

        {status === "error" && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMsg}
          </div>
        )}

        {!compareMode && result && status !== "error" && (
          <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark">
            <BudgetBar used={result.count} limit={budget} />
          </div>
        )}

        {compareMode && compareResults && status !== "error" && (
          <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-3">
            <span className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Per-model comparison
            </span>
            <div className="flex flex-col gap-2">
              {sortedCompareEntries.map(([modelId, r]) => (
                <div key={modelId} className="flex items-center justify-between text-sm">
                  <span className="text-ink/90">{MODEL_LABELS[modelId] ?? modelId}</span>
                  <span className="font-mono tabular text-mute">
                    {r.count.toLocaleString()} tok
                    {!r.exact && <span className="text-mute/70"> ~</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const REASON_LABEL = {
  redundant: "redundant",
  over_budget: "over budget",
};

const REASON_CLASS = {
  redundant: "bg-danger/15 text-danger",
  over_budget: "bg-line text-mute",
};

export function SentenceList({ sentences, maxScore }) {
  if (!sentences || sentences.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {sentences.map((s) => {
        const barWidth = s.score !== null && maxScore > 0 ? Math.max((s.score / maxScore) * 100, 2) : 0;

        return (
          <div
            key={s.index}
            className={`rounded-xl border p-3 transition-colors ${
              s.kept ? "border-line bg-surface" : "border-line/60 bg-surface/40 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-mute tabular">#{s.index}</span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    s.kept ? "bg-safe/15 text-safe" : REASON_CLASS[s.dropReason] ?? "bg-line text-mute"
                  }`}
                >
                  {s.kept ? "kept" : REASON_LABEL[s.dropReason] ?? "dropped"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-mute tabular shrink-0">{s.tokenCount} tok</span>
            </div>

            <p className="text-[13px] leading-snug text-ink/85 mb-2">{s.text}</p>

            {s.score !== null && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-void overflow-hidden">
                  <div className="h-full bg-gauge transition-all duration-300" style={{ width: `${barWidth}%` }} />
                </div>
                <span className="text-[11px] font-mono text-mute tabular w-12 text-right">
                  {s.score.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function tierButtonClass(active, variant) {
  const base = "px-2 py-0.5 rounded text-[11px] font-mono border transition-colors";
  if (active) {
    return variant === "always"
      ? `${base} bg-safe/20 border-safe text-safe`
      : `${base} bg-danger/20 border-danger text-danger`;
  }
  return `${base} bg-transparent border-line text-mute hover:border-mute`;
}

export function ChunkList({ chunks, maxSimilarity, onSetTier }) {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {chunks.map((chunk) => {
        const barWidth = maxSimilarity > 0 ? Math.max((chunk.similarity / maxSimilarity) * 100, 2) : 0;
        const isNever = chunk.tier === "never";
        const isAlways = chunk.tier === "always";

        return (
          <div
            key={chunk.index}
            className={`rounded-xl border p-3 transition-colors ${
              chunk.included
                ? "border-line bg-surface"
                : "border-line/60 bg-surface/40 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-mute tabular">#{chunk.index}</span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    chunk.included ? "bg-safe/15 text-safe" : "bg-line text-mute"
                  }`}
                >
                  {chunk.included ? "included" : "dropped"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-mute tabular shrink-0">
                {chunk.tokenCount} tok
              </span>
            </div>

            <p className="text-[13px] leading-snug text-ink/85 mb-2">{chunk.text}</p>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-void overflow-hidden">
                <div
                  className="h-full bg-gauge transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-mute tabular w-12 text-right">
                {chunk.similarity.toFixed(3)}
              </span>
            </div>

            {onSetTier && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  className={tierButtonClass(isAlways, "always")}
                  onClick={() => onSetTier(chunk.index, isAlways ? null : "always")}
                >
                  always
                </button>
                <button
                  type="button"
                  className={tierButtonClass(isNever, "never")}
                  onClick={() => onSetTier(chunk.index, isNever ? null : "never")}
                >
                  never
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

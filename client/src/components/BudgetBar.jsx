const TICKS = Array.from({ length: 9 }, (_, i) => (i + 1) * 10); // 10..90

function fillColor(percentUsed) {
  if (percentUsed === null) return "bg-mute";
  if (percentUsed > 100) return "bg-danger";
  if (percentUsed >= 75) return "bg-gauge";
  return "bg-safe";
}

function readoutColor(percentUsed) {
  if (percentUsed === null) return "text-mute";
  if (percentUsed > 100) return "text-danger";
  if (percentUsed >= 75) return "text-gauge";
  return "text-safe";
}

export function BudgetBar({ used, limit }) {
  const hasBudget = typeof limit === "number" && limit > 0;
  const percentUsed = hasBudget ? Math.round((used / limit) * 1000) / 10 : null;
  const fillPercent = hasBudget ? Math.min(percentUsed, 100) : 0;
  const overflowPercent = hasBudget && percentUsed > 100 ? Math.min(percentUsed - 100, 40) : 0;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[11px] tracking-[0.18em] text-mute uppercase">
          Token Budget
        </span>
        <span className={`font-mono text-sm tabular ${readoutColor(percentUsed)}`}>
          {used.toLocaleString()}
          {hasBudget && <span className="text-mute"> / {limit.toLocaleString()} tok</span>}
          {!hasBudget && <span className="text-mute"> tok</span>}
        </span>
      </div>

      <div className="relative h-3 rounded-md bg-surface border border-line overflow-hidden">
        {/* tick marks */}
        <div className="absolute inset-0 flex justify-between px-[1px] pointer-events-none">
          {TICKS.map((t) => (
            <div key={t} className="w-px h-full bg-line" />
          ))}
        </div>

        {/* fill */}
        <div
          className={`h-full transition-all duration-300 ease-out ${fillColor(percentUsed)}`}
          style={{ width: `${hasBudget ? fillPercent : 0}%` }}
        />

        {/* overflow hatch, when over budget */}
        {overflowPercent > 0 && (
          <div
            className="absolute top-0 right-0 h-full bg-danger/50"
            style={{
              width: `${overflowPercent}%`,
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(0,0,0,0.35) 0, rgba(0,0,0,0.35) 3px, transparent 3px, transparent 6px)",
            }}
          />
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[11px] text-mute font-mono">
          {hasBudget ? `${percentUsed}% used` : "no budget set"}
        </span>
        {hasBudget && percentUsed > 100 && (
          <span className="text-[11px] font-mono text-danger">
            +{(used - limit).toLocaleString()} over
          </span>
        )}
      </div>
    </div>
  );
}

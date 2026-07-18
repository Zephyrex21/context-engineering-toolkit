import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTheme } from "../context/ThemeContext.jsx";

const PALETTE = {
  light: { grid: "#E5E5E7", axis: "#6E6E73", accent: "#0071E3" },
  dark: { grid: "#38383A", axis: "#98989D", accent: "#0A84FF" },
};

function formatTimestamp(ts) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[12px] font-mono shadow-card dark:shadow-card-dark">
      <div className="text-mute mb-1">{formatTimestamp(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function TokensSavedChart({ timeline }) {
  const { theme } = useTheme();
  const colors = PALETTE[theme] ?? PALETTE.light;

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={timeline}>
          <defs>
            <linearGradient id="tokensSavedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke={colors.axis}
            tick={{ fontSize: 10, fontFamily: "monospace" }}
            minTickGap={40}
          />
          <YAxis stroke={colors.axis} tick={{ fontSize: 10, fontFamily: "monospace" }} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="tokensSaved"
            name="tokens saved"
            stroke={colors.accent}
            fill="url(#tokensSavedFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

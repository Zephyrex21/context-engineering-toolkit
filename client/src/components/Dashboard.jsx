import { useEffect, useState, lazy, Suspense } from "react";
import { fetchDashboardStats, fetchRecentRuns } from "../api/dashboard.js";

// recharts is a real chunk of weight (~350KB) — lazy-loaded so it's only
// fetched when someone actually opens the Dashboard tab, not bundled into
// every visitor's initial load.
const TokensSavedChart = lazy(() => import("./TokensSavedChart.jsx"));

function NoMongoConfigured() {
  return (
    <div className="rounded-xl border border-gauge/40 bg-gauge/5 p-6 flex flex-col gap-3">
      <span className="text-[11px] tracking-[0.18em] text-gauge uppercase">No persistence configured</span>
      <p className="text-sm text-ink/85 leading-relaxed">
        The dashboard needs somewhere to store run history. Add a connection string to{" "}
        <code className="text-[12px] bg-void px-1.5 py-0.5 rounded border border-line">server/.env</code>{" "}
        and restart the server:
      </p>
      <div className="rounded bg-void border border-line px-3 py-2 font-mono text-[12px] text-ink/80">
        MONGO_URI=your-connection-string-here
      </div>
      <p className="text-[12px] text-mute leading-relaxed">
        MongoDB Atlas's free M0 tier (512MB, no credit card) is plenty for this — every pipeline
        run you've made without a database configured simply wasn't saved; nothing's lost, there's
        just nothing yet to show.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-line bg-surface p-8 flex flex-col items-center gap-2 text-center">
      <span className="text-sm text-ink/80">No runs yet.</span>
      <span className="text-[12px] text-mute">
        Go run the Pipeline tab a few times — every run gets saved here automatically.
      </span>
    </div>
  );
}

function StatCard({ label, value, accent = "text-ink" }) {
  return (
    <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
      <span className="text-[11px] tracking-[0.18em] text-mute uppercase">{label}</span>
      <span className={`text-2xl font-mono tabular ${accent}`}>{value}</span>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [runs, setRuns] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchRecentRuns(10)])
      .then(([s, r]) => {
        setStats(s);
        setRuns(r.runs ?? []);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, []);

  if (status === "loading") {
    return <p className="text-sm text-mute">Loading dashboard...</p>;
  }
  if (status === "error") {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
        {errorMsg}
      </div>
    );
  }
  if (!stats.available) {
    return <NoMongoConfigured />;
  }
  if (stats.totalRuns === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total runs" value={stats.totalRuns} />
        <StatCard label="Tokens saved" value={stats.totalTokensSaved.toLocaleString()} accent="text-gauge" />
        <StatCard label="Avg reduction" value={`${stats.avgReductionPercent}%`} accent="text-gauge" />
        <StatCard
          label="Avg meaning kept"
          value={stats.avgMeaningPreserved !== null ? stats.avgMeaningPreserved.toFixed(2) : "—"}
        />
        <StatCard label="Est. cost saved" value={`$${stats.totalCostSaved.toFixed(6)}`} />
        <StatCard label="Evaluated" value={`${stats.evaluateRunRate}%`} />
      </div>

      <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark">
        <span className="text-[11px] tracking-[0.18em] text-mute uppercase block mb-4">
          Tokens saved over time
        </span>
        <Suspense fallback={<div className="h-[220px] flex items-center justify-center text-[12px] text-mute">Loading chart...</div>}>
          <TokensSavedChart timeline={stats.timeline} />
        </Suspense>
      </div>

      <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-card dark:shadow-card-dark">
        <span className="text-[11px] tracking-[0.18em] text-mute uppercase block px-4 pt-4 pb-3">
          Recent runs
        </span>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-t border-line text-[11px] text-mute uppercase font-mono">
              <th className="text-left font-normal px-4 py-2">Query</th>
              <th className="text-right font-normal px-4 py-2">Tokens</th>
              <th className="text-right font-normal px-4 py-2">Reduction</th>
              <th className="text-right font-normal px-4 py-2">Meaning</th>
              <th className="text-right font-normal px-4 py-2">Evaluated</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-4 py-2 text-ink/80 truncate max-w-xs">{r.query || "—"}</td>
                <td className="px-4 py-2 text-right font-mono text-ink/70 tabular">
                  {r.finalTokens}/{r.originalTokens}
                </td>
                <td className="px-4 py-2 text-right font-mono text-gauge tabular">
                  {r.overallReductionPercent}%
                </td>
                <td className="px-4 py-2 text-right font-mono text-ink/70 tabular">
                  {r.meaningPreserved !== null && r.meaningPreserved !== undefined
                    ? r.meaningPreserved.toFixed(2)
                    : "—"}
                </td>
                <td className="px-4 py-2 text-right font-mono text-mute">
                  {r.evaluateRan ? "yes" : "no"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

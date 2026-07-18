import { useEffect, useState } from "react";
import { unreachableServerMessage, API_URL } from "../api/errorMessages.js";

const IS_LOCAL_API = /localhost|127\.0\.0\.1/.test(API_URL);
const SLOW_THRESHOLD_MS = 1500;

export function ColdStartBanner() {
  const [state, setState] = useState("checking"); // checking | slow | ready | unreachable

  useEffect(() => {
    let cancelled = false;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setState("slow");
    }, SLOW_THRESHOLD_MS);

    fetch(`${API_URL}/api/health`)
      .then((res) => {
        if (cancelled) return;
        clearTimeout(slowTimer);
        setState(res.ok ? "ready" : "unreachable");
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(slowTimer);
        setState("unreachable");
      });

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  if (state === "checking" || state === "ready") return null;

  if (state === "slow") {
    return (
      <div className="mb-6 rounded-xl border border-gauge/40 bg-gauge/10 px-4 py-2.5 text-[13px] text-gauge flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-gauge animate-pulse shrink-0" />
        {IS_LOCAL_API
          ? "The backend is taking a while to respond — normal on first request while it loads the local embedding model."
          : "Waking up the server — this can take up to a minute on a free-tier host that's been idle."}
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-[13px] text-danger flex items-center justify-between gap-3">
      <span>{unreachableServerMessage()}</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-[12px] font-mono underline shrink-0"
      >
        retry
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useApiKey } from "../context/ApiKeyContext.jsx";

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
      <circle cx="12" cy="12" r="3.2" />
      <path
        d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KeyPanel({ apiKey, setApiKey, provider, setProvider, hasKey }) {
  return (
    <div className="w-80 rounded-xl border border-line bg-surface p-4 shadow-card dark:shadow-card-dark flex flex-col gap-3">
      <div>
        <span className="text-[11px] tracking-[0.18em] text-mute uppercase block mb-1">
          Bring your own key
        </span>
        <p className="text-[11px] text-mute leading-relaxed">
          Optional. Skips this demo's shared rate limit entirely — sent per-request only, never
          stored anywhere.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-line p-1 w-fit">
        {["gemini", "groq"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setProvider(p)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono uppercase transition-colors ${
              provider === p ? "bg-gauge/15 text-gauge" : "text-mute hover:text-ink/70"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={provider === "gemini" ? "AIza..." : "gsk_..."}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-lg bg-void border border-line px-3 py-2 text-[13px] font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
      />

      {hasKey && (
        <button
          type="button"
          onClick={() => setApiKey("")}
          className="text-[11px] font-mono text-mute hover:text-danger self-start"
        >
          clear key
        </button>
      )}

      <p className="text-[10px] text-mute leading-relaxed">
        Get a free Gemini key at aistudio.google.com, or a free Groq key at console.groq.com —
        neither requires a credit card.
      </p>
    </div>
  );
}

/**
 * Shared open/close logic: closes on outside click and on Escape. Without
 * this, a dropdown that opens over other interactive elements (e.g. the
 * sidebar variant opens upward, over the nav items above it) can only be
 * dismissed by re-clicking its own trigger — meaning a click intended for
 * whatever's now underneath it hits the panel instead, which looks exactly
 * like "that button doesn't work."
 */
function useDismissableOpen() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return { open, setOpen, wrapperRef };
}

export function SettingsPanel({ compact = false }) {
  const { apiKey, setApiKey, provider, setProvider, hasKey } = useApiKey();
  const { open, setOpen, wrapperRef } = useDismissableOpen();

  if (compact) {
    return (
      <div className="relative" ref={wrapperRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Settings"
          aria-expanded={open}
          className={`p-2 rounded-full border transition-colors ${
            hasKey ? "border-safe/50 text-safe bg-safe/10" : "border-line text-mute hover:text-ink"
          }`}
        >
          <GearIcon />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 z-30">
            <KeyPanel apiKey={apiKey} setApiKey={setApiKey} provider={provider} setProvider={setProvider} hasKey={hasKey} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
          hasKey ? "text-safe bg-safe/10" : "text-ink/75 hover:bg-line/50 hover:text-ink"
        }`}
      >
        <GearIcon />
        {hasKey ? "Using your key" : "Settings"}
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-30">
          <KeyPanel apiKey={apiKey} setApiKey={setApiKey} provider={provider} setProvider={setProvider} hasKey={hasKey} />
        </div>
      )}
    </div>
  );
}

export function NoLLMConfigured() {
  return (
    <div className="rounded-xl border border-gauge/40 bg-gauge/5 p-6 flex flex-col gap-3">
      <span className="text-[11px] tracking-[0.18em] text-gauge uppercase">No LLM configured</span>
      <p className="text-sm text-ink/85 leading-relaxed">
        This module needs an actual model call. Add one free key to{" "}
        <code className="text-[12px] bg-void px-1.5 py-0.5 rounded border border-line">server/.env</code>{" "}
        and restart the server:
      </p>
      <div className="flex flex-col gap-2">
        <div className="rounded bg-void border border-line px-3 py-2 font-mono text-[12px] text-ink/80">
          GEMINI_API_KEY=your-key-here
        </div>
        <div className="rounded bg-void border border-line px-3 py-2 font-mono text-[12px] text-ink/80">
          GROQ_API_KEY=your-key-here
        </div>
      </div>
      <p className="text-[12px] text-mute leading-relaxed">
        Either works — no credit card required for either. Get a Gemini key at{" "}
        <span className="text-ink/70">aistudio.google.com</span>, or a Groq key at{" "}
        <span className="text-ink/70">console.groq.com</span>.
      </p>
    </div>
  );
}

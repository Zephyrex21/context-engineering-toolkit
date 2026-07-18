import { NAV_GROUPS } from "../tabsConfig.js";
import { NavIcon } from "./NavIcon.jsx";
import { Logo } from "./Logo.jsx";

const HIGHLIGHTS = [
  { label: "Infrastructure cost", value: "$0" },
  { label: "Tools included", value: "7" },
  { label: "Runs without any key", value: "5 of 7" },
];

const STEPS = [
  { icon: "context", label: "Select", detail: "Chunk a document and keep only what's relevant to the question." },
  { icon: "compress", label: "Compress", detail: "Strip redundancy, trim to budget — no LLM, no cost." },
  { icon: "summarize", label: "Summarize", detail: "Only spend an LLM call if extraction genuinely fell short." },
  { icon: "evaluate", label: "Evaluate", detail: "Prove it: raw vs. engineered, real answers, side by side." },
];

function requiresLLMLabel(value) {
  if (value === false) return { text: "Runs locally", tone: "text-safe bg-safe/10" };
  if (value === true) return { text: "Needs an LLM key", tone: "text-gauge bg-gauge/10" };
  return { text: "LLM used when configured", tone: "text-mute bg-line/40" };
}

export function Home({ onNavigate }) {
  const toolItems = NAV_GROUPS.flatMap((g) => g.items);

  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <section className="flex flex-col items-start gap-6 pt-4">
        <Logo size={52} />
        <div className="flex flex-col gap-4 max-w-2xl">
          <h1 className="text-[34px] sm:text-[42px] font-semibold text-ink tracking-tight leading-[1.1]">
            Send your model exactly what it needs.{" "}
            <span className="text-mute">Nothing else.</span>
          </h1>
          <p className="text-[16px] text-mute leading-relaxed max-w-xl">
            Most of what people paste into an LLM's context window is noise. This toolkit selects
            the relevant chunks, compresses what's left, upgrades to a real summary only when it's
            actually needed, and proves the smaller version answers better — not just cheaper.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => onNavigate("pipeline")}
            className="rounded-xl bg-gauge text-white text-[14px] font-medium px-5 py-2.5 shadow-sm hover:brightness-110 active:brightness-95 transition-all"
          >
            Run the Pipeline
          </button>
          <button
            onClick={() => onNavigate("dashboard")}
            className="rounded-xl border border-line text-ink text-[14px] font-medium px-5 py-2.5 hover:bg-line/40 transition-colors"
          >
            View Dashboard
          </button>
        </div>
      </section>

      {/* Highlights */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl">
        {HIGHLIGHTS.map((h) => (
          <div
            key={h.label}
            className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1"
          >
            <span className="text-xl sm:text-2xl font-mono text-gauge tabular">{h.value}</span>
            <span className="text-[11px] text-mute leading-snug">{h.label}</span>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[13px] tracking-[0.18em] text-mute uppercase font-medium">
          How the pipeline works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <div
              key={step.label}
              className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-gauge">
                <NavIcon type={step.icon} />
                <span className="text-[11px] font-mono text-mute">0{i + 1}</span>
              </div>
              <span className="text-[14px] font-medium text-ink">{step.label}</span>
              <p className="text-[12px] text-mute leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tool grid */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[13px] tracking-[0.18em] text-mute uppercase font-medium">
          Every tool, on its own
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolItems.map((item) => {
            const badge = requiresLLMLabel(item.requiresLLM);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="text-left rounded-2xl bg-surface border border-line p-5 shadow-card dark:shadow-card-dark hover:-translate-y-0.5 hover:shadow-glass transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gauge/10 text-gauge">
                    <NavIcon type={item.icon} />
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${badge.tone}`}>
                    {badge.text}
                  </span>
                </div>
                <div>
                  <div className="text-[15px] font-medium text-ink mb-1">{item.label}</div>
                  <p className="text-[12.5px] text-mute leading-relaxed">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Why $0 */}
      <section className="rounded-2xl border border-line bg-surface p-6 shadow-card dark:shadow-card-dark flex flex-col gap-2 max-w-2xl">
        <h2 className="text-[13px] tracking-[0.18em] text-mute uppercase font-medium">
          Why this runs on $0 infrastructure
        </h2>
        <p className="text-[13px] text-mute leading-relaxed">
          Local embeddings mean selection costs nothing no matter how many times you run it.
          Extractive compression is pure computation — zero API calls. The LLM only gets involved
          when the free path genuinely isn't enough. Gemini and Groq's free tiers, MongoDB Atlas's
          free tier, and free hosting on Render and Vercel cover a real working demo without ever
          reaching for a credit card.
        </p>
      </section>
    </div>
  );
}

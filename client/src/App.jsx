import { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ApiKeyProvider } from "./context/ApiKeyContext.jsx";
import { AmbientBackground } from "./components/AmbientBackground.jsx";
import { ColdStartBanner } from "./components/ColdStartBanner.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { MobileNav } from "./components/MobileNav.jsx";
import { Home } from "./components/Home.jsx";
import { PipelineVisualizer } from "./components/PipelineVisualizer.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { TokenCounter } from "./components/TokenCounter.jsx";
import { ContextSelector } from "./components/ContextSelector.jsx";
import { Compressor } from "./components/Compressor.jsx";
import { Summarizer } from "./components/Summarizer.jsx";
import { Evaluator } from "./components/Evaluator.jsx";
import { ALL_TABS } from "./tabsConfig.js";

const PANELS = {
  pipeline: PipelineVisualizer,
  dashboard: Dashboard,
  tokens: TokenCounter,
  context: ContextSelector,
  compress: Compressor,
  summarize: Summarizer,
  evaluate: Evaluator,
};

function AppShell() {
  const [tab, setTab] = useState("home");
  const active = ALL_TABS.find((t) => t.id === tab);
  const ActivePanel = PANELS[tab];
  const isHome = tab === "home";

  return (
    <div className="min-h-screen bg-void text-ink flex">
      <AmbientBackground />
      <Sidebar activeTab={tab} onSelect={setTab} />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileNav activeTab={tab} onSelect={setTab} />

        <div className="max-w-5xl w-full mx-auto px-6 py-10 lg:py-12 flex-1">
          <ColdStartBanner />

          {!isHome && (
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gauge" />
                <span className="text-[11px] tracking-[0.18em] text-mute uppercase">
                  {active?.requiresLLM === false && "Runs locally · no LLM needed"}
                  {active?.requiresLLM === true && "Needs an LLM key"}
                  {active?.requiresLLM === "partial" && "LLM used when configured"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-[28px] font-semibold text-ink tracking-tight">
                {active?.label}
              </h1>
              <p className="mt-1.5 text-[14px] text-mute max-w-xl">{active?.description}</p>
            </header>
          )}

          <main>
            {isHome ? <Home onNavigate={setTab} /> : ActivePanel && <ActivePanel />}
          </main>

          <footer className="mt-14 pt-6 border-t border-line">
            <p className="text-[11px] text-mute">
              Pipeline, Summarizer, and Evaluator use an LLM when configured (free tier — see
              README) or your own key (Settings). Token Engine, Context Selector, and Compressor
              run entirely locally, no LLM required.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ApiKeyProvider>
        <AppShell />
      </ApiKeyProvider>
    </ThemeProvider>
  );
}

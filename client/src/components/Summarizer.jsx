import { useEffect, useState } from "react";
import { fetchSummarizeStatus } from "../api/summarize.js";
import { useApiKey } from "../context/ApiKeyContext.jsx";
import { DocumentSummarizer } from "./DocumentSummarizer.jsx";
import { ChatCompressor } from "./ChatCompressor.jsx";
import { NoLLMConfigured } from "./NoLLMConfigured.jsx";

export function Summarizer() {
  const { apiKey, provider: userProvider, hasKey } = useApiKey();
  const [serverAvailable, setServerAvailable] = useState(null); // null = checking
  const [serverProvider, setServerProvider] = useState(null);
  const [mode, setMode] = useState("document");

  useEffect(() => {
    fetchSummarizeStatus()
      .then((s) => {
        setServerAvailable(s.available);
        setServerProvider(s.provider);
      })
      .catch(() => setServerAvailable(false));
  }, []);

  if (serverAvailable === null) {
    return <p className="text-sm text-mute">Checking LLM availability...</p>;
  }

  const available = serverAvailable || hasKey;
  if (!available) {
    return <NoLLMConfigured />;
  }

  const activeProvider = hasKey ? userProvider : serverProvider;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-line p-1 bg-surface w-fit">
          {[
            { id: "document", label: "Document" },
            { id: "chat", label: "Chat History" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
                mode === m.id ? "bg-gauge/20 text-gauge" : "text-mute hover:text-ink/70"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-mute">
          engine: {activeProvider} {hasKey && "(your key)"}
        </span>
      </div>

      {mode === "document" ? (
        <DocumentSummarizer apiKey={apiKey} provider={userProvider} />
      ) : (
        <ChatCompressor apiKey={apiKey} provider={userProvider} />
      )}
    </div>
  );
}

import { useState } from "react";
import { compressChatHistory } from "../api/summarize.js";

const SAMPLE_MESSAGES = [
  { role: "user", content: "How do I set up a Node project?" },
  { role: "assistant", content: "Run npm init and install express." },
  { role: "user", content: "What about the database?" },
  { role: "assistant", content: "MongoDB Atlas free tier works well for this." },
  { role: "user", content: "How do I deploy it for free?" },
  { role: "assistant", content: "Use Render for the backend and Vercel for the frontend." },
  { role: "user", content: "Does Render have cold starts?" },
  { role: "assistant", content: "Yes, the free tier spins down after 15 minutes of inactivity." },
];

function MessageRow({ message, onChange, onRemove }) {
  return (
    <div className="flex gap-2 items-start">
      <button
        type="button"
        onClick={() => onChange({ ...message, role: message.role === "user" ? "assistant" : "user" })}
        className={`shrink-0 w-20 text-[11px] font-mono uppercase py-1.5 rounded border transition-colors ${
          message.role === "user"
            ? "bg-gauge/15 border-gauge text-gauge"
            : "bg-safe/15 border-safe text-safe"
        }`}
      >
        {message.role}
      </button>
      <textarea
        value={message.content}
        onChange={(e) => onChange({ ...message, content: e.target.value })}
        rows={1}
        className="flex-1 resize-none rounded-xl bg-surface border border-line px-3 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
      />
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 w-7 h-7 rounded border border-line text-mute hover:text-danger hover:border-danger/60 transition-colors text-sm"
        aria-label="Remove message"
      >
        ×
      </button>
    </div>
  );
}

export function ChatCompressor({ apiKey, provider }) {
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [keepRecent, setKeepRecent] = useState(2);

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function updateMessage(index, next) {
    setMessages((prev) => prev.map((m, i) => (i === index ? next : m)));
  }

  function removeMessage(index) {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  }

  function addMessage() {
    const lastRole = messages[messages.length - 1]?.role ?? "assistant";
    setMessages((prev) => [...prev, { role: lastRole === "user" ? "assistant" : "user", content: "" }]);
  }

  async function run() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await compressChatHistory({ messages, keepRecent, apiKey, provider });
      setResult(r);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Conversation ({messages.length} messages)
            </label>
            <button
              type="button"
              onClick={addMessage}
              className="text-[11px] font-mono text-mute hover:text-ink border border-line rounded px-2 py-1 transition-colors"
            >
              + add message
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <MessageRow
                key={i}
                message={m}
                onChange={(next) => updateMessage(i, next)}
                onRemove={() => removeMessage(i)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Keep recent (verbatim)
            </label>
            <input
              type="number"
              min={1}
              value={keepRecent}
              onChange={(e) => setKeepRecent(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-surface border border-line px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-gauge/60"
            />
          </div>
          <button
            type="button"
            onClick={run}
            disabled={status === "loading" || messages.length === 0}
            className="w-full rounded-xl bg-gauge text-white text-sm font-medium py-2.5 shadow-sm hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50"
          >
            {status === "loading" ? "Compressing..." : "Compress History"}
          </button>
          <span className="text-[11px] text-mute text-center">
            everything older than the last {keepRecent} messages gets summarized into one block
          </span>
        </div>
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      {result && status !== "error" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Reduction</span>
              <span className="text-2xl font-mono text-gauge tabular">{result.compressionRatio}%</span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Tokens</span>
              <span className="text-2xl font-mono text-ink tabular">
                {result.compressedTokens}
                <span className="text-mute text-sm"> / {result.originalTokens}</span>
              </span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Turns summarized</span>
              <span className="text-2xl font-mono text-ink tabular">{result.turnsSummarized}</span>
            </div>
            <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.18em] text-mute uppercase">Provider</span>
              <span className="text-sm font-mono text-ink tabular pt-1.5">
                {result.provider ?? "n/a"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-surface border border-line p-4 shadow-card dark:shadow-card-dark flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.18em] text-mute uppercase">
              Compressed conversation
            </span>
            {result.compressedMessages.map((m, i) => (
              <div
                key={i}
                className={`rounded px-3 py-2 text-[13px] ${
                  m.role === "system"
                    ? "bg-gauge/10 border border-gauge/30 text-ink/90"
                    : "bg-void border border-line text-ink/85"
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-mute mr-2">{m.role}</span>
                {m.content}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

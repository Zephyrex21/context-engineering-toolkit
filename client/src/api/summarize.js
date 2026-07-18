import { unreachableServerMessage } from "./errorMessages.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(unreachableServerMessage());
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.code = data.code;
    throw err;
  }
  return data;
}

export function fetchSummarizeStatus() {
  return request("/api/summarize/status");
}

export function summarizeDocument({ text, budget, chunkTokens, apiKey, provider }) {
  return request("/api/summarize/document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, budget, chunkTokens, apiKey: apiKey || undefined, provider }),
  });
}

export function compressChatHistory({ messages, keepRecent, targetSummaryTokens, apiKey, provider }) {
  return request("/api/summarize/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      keepRecent,
      targetSummaryTokens,
      apiKey: apiKey || undefined,
      provider,
    }),
  });
}

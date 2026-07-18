import { unreachableServerMessage } from "./errorMessages.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function runPipeline({ document, query, budget, referenceAnswer, meaningThreshold, apiKey, provider }) {
  let res;
  try {
    res = await fetch(`${API_URL}/api/pipeline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document,
        query,
        budget,
        referenceAnswer,
        meaningThreshold,
        apiKey: apiKey || undefined,
        provider,
      }),
    });
  } catch {
    throw new Error(unreachableServerMessage());
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

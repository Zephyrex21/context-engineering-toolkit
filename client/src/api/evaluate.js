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

export function fetchEvaluateStatus() {
  return request("/api/evaluate/status");
}

export function compareContexts({ query, rawContext, engineeredContext, referenceAnswer, apiKey, provider }) {
  return request("/api/evaluate/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      rawContext,
      engineeredContext,
      referenceAnswer,
      apiKey: apiKey || undefined,
      provider,
    }),
  });
}

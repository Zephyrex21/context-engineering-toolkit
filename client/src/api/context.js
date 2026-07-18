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
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function selectContext({ document, query, budget, chunkTokens, mmrLambda, overrides }) {
  return request("/api/context/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document, query, budget, chunkTokens, mmrLambda, overrides }),
  });
}

export function fetchContextStatus() {
  return request("/api/context/status");
}

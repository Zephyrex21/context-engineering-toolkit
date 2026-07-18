import { unreachableServerMessage } from "./errorMessages.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function postJson(path, body) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(unreachableServerMessage());
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function countTokens({ text, model, budget }) {
  return postJson("/api/tokens/count", { text, model, budget });
}

export function countTokensAllModels({ text, budget }) {
  return postJson("/api/tokens/count-all", { text, budget });
}

export async function fetchModels() {
  const res = await fetch(`${API_URL}/api/tokens/models`);
  if (!res.ok) throw new Error("Failed to load model list.");
  return res.json();
}

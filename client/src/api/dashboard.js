import { unreachableServerMessage } from "./errorMessages.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request(path) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`);
  } catch {
    throw new Error(unreachableServerMessage());
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function fetchDashboardStats() {
  return request("/api/dashboard/stats");
}

export function fetchRecentRuns(limit = 10) {
  return request(`/api/dashboard/runs?limit=${limit}`);
}

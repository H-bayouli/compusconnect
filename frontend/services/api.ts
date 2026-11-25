const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
export function apiFetch(input: string, init: RequestInit = {}) {
  const url = input.startsWith("http") ? input : `${API_BASE}${input}`;
  return fetch(url, { ...init, credentials: "include" });
}

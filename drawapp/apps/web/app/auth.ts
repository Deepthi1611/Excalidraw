export const TOKEN_KEY = "auth_token";

export function setToken(token: string, persist: "local" | "session" = "local") {
  if (typeof window === "undefined") return;
  if (persist === "local") localStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

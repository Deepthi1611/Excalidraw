const API_BASE_URL =
  process.env.NEXT_PUBLIC_HTTP_BACKEND_URL?.trim() || "http://localhost:3000";

const TOKEN_KEY = "auth_token";
const CANVAS_ROUTE = "/canvas";
const CANVAS_SIGNIN_ROUTE = "/signin?next=%2Fcanvas";

type SignInPayload = {
  email: string;
  password: string;
};

type SignUpPayload = {
  name: string;
  email: string;
  password: string;
  photo?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  try {
    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      const message = (data && "error" in data && data.error) || "Request failed";
      throw new Error(message);
    }
    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to parse response";
    throw new Error(message);
  }
}

export async function signIn(payload: SignInPayload): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await parseResponse<{ token?: string }>(response);
    if (!data.token) {
      throw new Error("Signin succeeded but token is missing");
    }

    setToken(data.token);
    return data.token;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sign in failed";
    throw new Error(message);
  }
}

export async function signUp(payload: SignUpPayload): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await parseResponse(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sign up failed";
    throw new Error(message);
  }
}

export function getToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    return;
  }
}

export function clearToken(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
}

// Backend does not expose a /signout route yet, so signout is client-side for now.
export function signOut(): void {
  try {
    clearToken();
  } catch {
    return;
  }
}

export function getCanvasEntryPath(): string {
  try {
    // Temporary bypass: allow opening canvas without forcing signin.
    return CANVAS_ROUTE;
    // const token = getToken();
    // return token ? CANVAS_ROUTE : CANVAS_SIGNIN_ROUTE;
  } catch {
    return CANVAS_ROUTE;
  }
}

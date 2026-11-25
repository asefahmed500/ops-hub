import { Platform } from "react-native";

const DEFAULT_HOST =
  Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

const RAW_BASE = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_HOST).replace(/\/+$/, "");
export const API_BASE = RAW_BASE.endsWith("/api") ? RAW_BASE : `${RAW_BASE}/api`;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  let res: Response;
  const normalizedPath = path.startsWith("/api/") ? path.slice(4) : path;
  const url = `${API_BASE}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Cannot reach server at ${API_BASE}. Is the backend running?`);
  }
  if (res.status === 401 && token) {
    // Authenticated request rejected — session is stale/expired.
    // (Login failures keep the server's real message, e.g. "Invalid email or password".)
    throw new ApiError(401, "Session expired. Please sign in again.");
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (Array.isArray(data?.message)) message = data.message.join(", ");
      else if (data?.message) message = data.message;
      else if (data?.error) message = data.error;
    } catch {
      // keep default message
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

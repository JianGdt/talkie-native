import { supabase } from "@/lib/supabase/client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not defined");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  signal?: AbortSignal;
}

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new ApiError(401, "Unauthenticated");
  return { Authorization: `Bearer ${session.access_token}` };
};

const buildUrl = (
  endpoint: string,
  params?: Record<string, string | number>,
) => {
  const url = `${API_URL}${endpoint}`;
  if (!params) return url;
  const searchParams = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  );
  return `${url}?${searchParams}`;
};

const request = async <T>(
  method: string,
  endpoint: string,
  options?: RequestOptions & { data?: unknown },
): Promise<T> => {
  const authHeaders = await getAuthHeaders();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders,
    ...options?.headers,
  };

  const response = await fetch(buildUrl(endpoint, options?.params), {
    method,
    headers,
    body: options?.data ? JSON.stringify(options.data) : undefined,
    signal: options?.signal,
  });

  if (response.status === 204) return undefined as T;

  const json = await response
    .json()
    .catch(() => ({ message: "Request failed" }));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      json.message || json.error || "Request failed",
      json,
    );
  }

  return json as T;
};

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>("GET", endpoint, options),

  post: <T = any>(endpoint: string, data: unknown, options?: RequestOptions) =>
    request<T>("POST", endpoint, { ...options, data }),

  patch: <T = any>(endpoint: string, data: unknown, options?: RequestOptions) =>
    request<T>("PATCH", endpoint, { ...options, data }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>("DELETE", endpoint, options),
};

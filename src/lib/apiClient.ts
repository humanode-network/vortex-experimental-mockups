import type { GetFeedResponse } from "@/types/api";

export type ApiError = {
  error: {
    message: string;
    [key: string]: unknown;
  };
};

async function readJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const body = isJson ? ((await res.json()) as unknown) : null;
  if (!res.ok) {
    const message =
      (body as ApiError | null)?.error?.message ??
      (typeof body === "string" ? body : null) ??
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  return await readJsonResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: { headers?: HeadersInit },
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
  return await readJsonResponse<T>(res);
}

export type ApiMeResponse =
  | { authenticated: false }
  | {
      authenticated: true;
      address: string;
      gate: { eligible: boolean; reason?: string; expiresAt: string };
    };

export async function apiMe(): Promise<ApiMeResponse> {
  return await apiGet<ApiMeResponse>("/api/me");
}

export async function apiLogout(): Promise<{ ok: true }> {
  return await apiPost<{ ok: true }>("/api/auth/logout", {});
}

export async function apiNonce(address: string): Promise<{ nonce: string }> {
  return await apiPost<{ nonce: string }>("/api/auth/nonce", { address });
}

export async function apiVerify(input: {
  address: string;
  nonce: string;
  signature: string;
}): Promise<{ ok: true; address: string }> {
  return await apiPost<{ ok: true; address: string }>(
    "/api/auth/verify",
    input,
  );
}

export async function apiFeed(input?: {
  stage?: string;
  cursor?: string;
}): Promise<GetFeedResponse> {
  const params = new URLSearchParams();
  if (input?.stage) params.set("stage", input.stage);
  if (input?.cursor) params.set("cursor", input.cursor);
  const qs = params.size ? `?${params.toString()}` : "";
  return await apiGet<GetFeedResponse>(`/api/feed${qs}`);
}

import type {
  ChamberProposalPageDto,
  CourtCaseDetailDto,
  FactionDto,
  FormationProposalPageDto,
  GetFactionsResponse,
  GetChamberResponse,
  GetChambersResponse,
  GetCourtsResponse,
  GetFeedResponse,
  GetFormationResponse,
  GetHumansResponse,
  GetInvisionResponse,
  GetMyGovernanceResponse,
  GetProposalDraftsResponse,
  GetProposalsResponse,
  HumanNodeProfileDto,
  ProposalDraftDetailDto,
  PoolProposalPageDto,
} from "@/types/api";

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

export async function apiChambers(): Promise<GetChambersResponse> {
  return await apiGet<GetChambersResponse>("/api/chambers");
}

export async function apiChamber(id: string): Promise<GetChamberResponse> {
  return await apiGet<GetChamberResponse>(`/api/chambers/${id}`);
}

export async function apiProposals(input?: {
  stage?: string;
}): Promise<GetProposalsResponse> {
  const params = new URLSearchParams();
  if (input?.stage) params.set("stage", input.stage);
  const qs = params.size ? `?${params.toString()}` : "";
  return await apiGet<GetProposalsResponse>(`/api/proposals${qs}`);
}

export async function apiProposalPoolPage(
  id: string,
): Promise<PoolProposalPageDto> {
  return await apiGet<PoolProposalPageDto>(`/api/proposals/${id}/pool`);
}

export type PoolVoteDirection = "up" | "down";

export async function apiPoolVote(input: {
  proposalId: string;
  direction: PoolVoteDirection;
  idempotencyKey?: string;
}): Promise<{
  ok: true;
  type: "pool.vote";
  proposalId: string;
  direction: PoolVoteDirection;
  counts: { upvotes: number; downvotes: number };
}> {
  return await apiPost(
    "/api/command",
    {
      type: "pool.vote",
      payload: { proposalId: input.proposalId, direction: input.direction },
      idempotencyKey: input.idempotencyKey,
    },
    input.idempotencyKey
      ? { headers: { "idempotency-key": input.idempotencyKey } }
      : undefined,
  );
}

export async function apiProposalChamberPage(
  id: string,
): Promise<ChamberProposalPageDto> {
  return await apiGet<ChamberProposalPageDto>(`/api/proposals/${id}/chamber`);
}

export async function apiProposalFormationPage(
  id: string,
): Promise<FormationProposalPageDto> {
  return await apiGet<FormationProposalPageDto>(
    `/api/proposals/${id}/formation`,
  );
}

export async function apiCourts(): Promise<GetCourtsResponse> {
  return await apiGet<GetCourtsResponse>("/api/courts");
}

export async function apiCourt(id: string): Promise<CourtCaseDetailDto> {
  return await apiGet<CourtCaseDetailDto>(`/api/courts/${id}`);
}

export async function apiHumans(): Promise<GetHumansResponse> {
  return await apiGet<GetHumansResponse>("/api/humans");
}

export async function apiHuman(id: string): Promise<HumanNodeProfileDto> {
  return await apiGet<HumanNodeProfileDto>(`/api/humans/${id}`);
}

export async function apiFactions(): Promise<GetFactionsResponse> {
  return await apiGet<GetFactionsResponse>("/api/factions");
}

export async function apiFaction(id: string): Promise<FactionDto> {
  return await apiGet<FactionDto>(`/api/factions/${id}`);
}

export async function apiFormation(): Promise<GetFormationResponse> {
  return await apiGet<GetFormationResponse>("/api/formation");
}

export async function apiInvision(): Promise<GetInvisionResponse> {
  return await apiGet<GetInvisionResponse>("/api/invision");
}

export async function apiMyGovernance(): Promise<GetMyGovernanceResponse> {
  return await apiGet<GetMyGovernanceResponse>("/api/my-governance");
}

export async function apiProposalDrafts(): Promise<GetProposalDraftsResponse> {
  return await apiGet<GetProposalDraftsResponse>("/api/proposals/drafts");
}

export async function apiProposalDraft(
  id: string,
): Promise<ProposalDraftDetailDto> {
  return await apiGet<ProposalDraftDetailDto>(`/api/proposals/drafts/${id}`);
}

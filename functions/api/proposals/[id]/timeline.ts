import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import { listProposalTimelineItems } from "../../../_lib/proposalTimelineStore.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing proposal id");

    const url = new URL(context.request.url);
    const limitParam = url.searchParams.get("limit");
    const limitRaw = limitParam ? Number.parseInt(limitParam, 10) : 100;
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, limitRaw))
      : 100;

    const items = await listProposalTimelineItems(context.env, {
      proposalId: id,
      limit,
    });
    return jsonResponse({ items });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

import { assertAdmin } from "../../../_lib/clockStore.ts";
import { listAdminAudit } from "../../../_lib/adminAuditStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";

const DEFAULT_LIMIT = 50;

export const onRequestGet: PagesFunction = async (context) => {
  try {
    assertAdmin(context);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    return errorResponse(status, (error as Error).message);
  }

  const url = new URL(context.request.url);
  const cursor = url.searchParams.get("cursor");
  let beforeSeq: number | undefined;
  if (cursor !== null) {
    const parsed = Number.parseInt(cursor, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return errorResponse(400, "Invalid cursor");
    }
    beforeSeq = parsed;
  }

  const page = await listAdminAudit(context.env, {
    beforeSeq,
    limit: DEFAULT_LIMIT,
  });
  const response =
    page.nextSeq !== undefined
      ? { items: page.items, nextCursor: String(page.nextSeq) }
      : { items: page.items };
  return jsonResponse(response);
};

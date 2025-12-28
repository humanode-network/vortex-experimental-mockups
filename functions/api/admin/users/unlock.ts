import { z } from "zod";

import { assertAdmin } from "../../../_lib/clockStore.ts";
import { createActionLocksStore } from "../../../_lib/actionLocksStore.ts";
import { appendAdminAudit } from "../../../_lib/adminAuditStore.ts";
import { errorResponse, jsonResponse, readJson } from "../../../_lib/http.ts";

const schema = z.object({
  address: z.string().min(1),
});

export const onRequestPost: PagesFunction = async (context) => {
  try {
    assertAdmin(context);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    return errorResponse(status, (error as Error).message);
  }

  let body: unknown;
  try {
    body = await readJson(context.request);
  } catch (error) {
    return errorResponse(400, (error as Error).message);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "Invalid body", { issues: parsed.error.issues });
  }

  await createActionLocksStore(context.env).clearLock(parsed.data.address);
  await appendAdminAudit(context.env, {
    action: "user.unlock",
    targetAddress: parsed.data.address,
  });
  return jsonResponse({ ok: true });
};

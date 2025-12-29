import { z } from "zod";

import { assertAdmin } from "../../../_lib/clockStore.ts";
import { appendAdminAudit } from "../../../_lib/adminAuditStore.ts";
import { createAdminStateStore } from "../../../_lib/adminStateStore.ts";
import { errorResponse, jsonResponse, readJson } from "../../../_lib/http.ts";

const schema = z.object({
  enabled: z.boolean(),
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

  const enabled = parsed.data.enabled;
  await createAdminStateStore(context.env).setWritesFrozen(enabled);

  await appendAdminAudit(context.env, {
    action: enabled ? "writes.freeze" : "writes.unfreeze",
    targetAddress: "global",
  });

  return jsonResponse({ ok: true, writesFrozen: enabled });
};

import { assertAdmin } from "../../../_lib/clockStore.ts";
import { createActionLocksStore } from "../../../_lib/actionLocksStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    assertAdmin(context);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    return errorResponse(status, (error as Error).message);
  }

  const locks = await createActionLocksStore(context.env).listActiveLocks();
  return jsonResponse({ items: locks });
};

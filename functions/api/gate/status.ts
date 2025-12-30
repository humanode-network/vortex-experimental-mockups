import { readSession } from "../../_lib/auth.ts";
import { checkEligibility } from "../../_lib/gate.ts";
import { jsonResponse } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  const session = await readSession(context.request, context.env);
  if (!session) {
    return jsonResponse({
      eligible: false,
      reason: "not_authenticated",
      expiresAt: new Date().toISOString(),
    });
  }
  return jsonResponse(
    await checkEligibility(context.env, session.address, context.request.url),
  );
};

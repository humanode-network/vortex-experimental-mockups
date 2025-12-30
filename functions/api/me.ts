import { readSession } from "../_lib/auth.ts";
import { checkEligibility } from "../_lib/gate.ts";
import { jsonResponse } from "../_lib/http.ts";

export const onRequestGet: PagesFunction = async (context) => {
  const session = await readSession(context.request, context.env);
  if (!session) return jsonResponse({ authenticated: false });
  const gate = await checkEligibility(
    context.env,
    session.address,
    context.request.url,
  );
  return jsonResponse({
    authenticated: true,
    address: session.address,
    gate,
  });
};

import { issueNonce } from "../../_lib/auth.ts";
import { createNonceStore } from "../../_lib/nonceStore.ts";
import { errorResponse, jsonResponse, readJson } from "../../_lib/http.ts";

type Body = { address?: string };

function getRequestIp(request: Request): string | undefined {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = request.headers.get("x-forwarded-for");
  if (!xff) return undefined;
  return xff.split(",")[0]?.trim() || undefined;
}

export const onRequestPost: PagesFunction = async (context) => {
  let body: Body;
  try {
    body = await readJson<Body>(context.request);
  } catch (error) {
    return errorResponse(400, (error as Error).message);
  }

  const address = (body.address ?? "").trim();
  if (!address) return errorResponse(400, "Missing address");

  const headers = new Headers();
  try {
    const nonceStore = createNonceStore(context.env);
    const requestIp = getRequestIp(context.request);
    const rate = await nonceStore.canIssue({ address, requestIp });
    if (!rate.ok)
      return errorResponse(429, "Rate limited", {
        retryAfterSeconds: rate.retryAfterSeconds,
      });

    const { nonce, expiresAt } = await issueNonce(
      headers,
      context.env,
      context.request.url,
      address,
    );

    await nonceStore.create({
      address,
      nonce,
      requestIp,
      expiresAt: new Date(expiresAt),
    });
    return jsonResponse({ nonce }, { headers });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

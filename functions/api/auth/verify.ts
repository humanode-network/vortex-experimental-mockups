import { issueSession, verifyNonceCookie } from "../../_lib/auth.ts";
import { envBoolean } from "../../_lib/env.ts";
import { createNonceStore } from "../../_lib/nonceStore.ts";
import { verifySubstrateSignature } from "../../_lib/signatures.ts";
import { errorResponse, jsonResponse, readJson } from "../../_lib/http.ts";
import { upsertUser } from "../../_lib/userStore.ts";
import {
  canonicalizeHmndAddress,
  addressesReferToSameKey,
} from "../../_lib/address.ts";

type Body = {
  address?: string;
  nonce?: string;
  signature?: string;
};

export const onRequestPost: PagesFunction = async (context) => {
  let body: Body;
  try {
    body = await readJson<Body>(context.request);
  } catch (error) {
    return errorResponse(400, (error as Error).message);
  }

  const address = (body.address ?? "").trim();
  const nonce = (body.nonce ?? "").trim();
  const signature = (body.signature ?? "").trim();
  if (!address) return errorResponse(400, "Missing address");
  if (!nonce) return errorResponse(400, "Missing nonce");
  if (!signature) return errorResponse(400, "Missing signature");
  const canonical = (await canonicalizeHmndAddress(address)) ?? address;

  const nonceToken = await verifyNonceCookie(context.request, context.env);
  if (!nonceToken)
    return errorResponse(
      401,
      "Nonce expired or missing; call /api/auth/nonce again",
    );
  if (!(await addressesReferToSameKey(nonceToken.address, canonical)))
    return errorResponse(401, "Nonce was issued for a different address");
  if (nonceToken.nonce !== nonce) return errorResponse(401, "Nonce mismatch");

  const nonceStore = createNonceStore(context.env);
  const consume = await nonceStore.consume({ address: canonical, nonce });
  if (!consume.ok) {
    const message =
      consume.reason === "expired"
        ? "Nonce expired; call /api/auth/nonce again"
        : consume.reason === "used"
          ? "Nonce already used; call /api/auth/nonce again"
          : "Nonce invalid; call /api/auth/nonce again";
    return errorResponse(401, message, { reason: consume.reason });
  }

  if (!envBoolean(context.env, "DEV_BYPASS_SIGNATURE")) {
    const ok = await verifySubstrateSignature({
      address: canonical,
      message: nonce,
      signature,
    });
    if (!ok) return errorResponse(401, "Invalid signature");
  }

  const headers = new Headers();
  await issueSession(headers, context.env, context.request.url, canonical);
  await upsertUser(context.env, { address: canonical });
  return jsonResponse({ ok: true, address: canonical }, { headers });
};

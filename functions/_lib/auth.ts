import { parseCookieHeader, serializeCookie } from "./cookies.ts";
import { envBoolean, envString } from "./env.ts";
import { randomHex } from "./random.ts";
import { signToken, verifyToken } from "./tokens.ts";

export type Env = Record<string, string | undefined>;

export type Session = {
  address: string;
  issuedAt: number;
  expiresAt: number;
};

export type NonceToken = {
  address: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

const SESSION_COOKIE = "vortex_session";
const NONCE_COOKIE = "vortex_nonce";

function shouldUseSecureCookies(env: Env, requestUrl: string): boolean {
  if (envBoolean(env, "DEV_INSECURE_COOKIES")) return false;
  return requestUrl.startsWith("https://");
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getNonceCookieName(): string {
  return NONCE_COOKIE;
}

export function getSessionSecret(env: Env): string | undefined {
  return envString(env, "SESSION_SECRET");
}

export async function issueNonce(
  headers: Headers,
  env: Env,
  requestUrl: string,
  address: string,
): Promise<{ nonce: string; expiresAt: number }> {
  const secret = getSessionSecret(env);
  const nonce = randomHex(16);
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 10 * 60_000;

  if (!secret) throw new Error("SESSION_SECRET is required to issue nonces");
  const token = await signToken(
    { address, nonce, issuedAt, expiresAt } satisfies NonceToken,
    secret,
  );

  const secure = shouldUseSecureCookies(env, requestUrl);
  headers.append(
    "set-cookie",
    serializeCookie(NONCE_COOKIE, token, {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      maxAgeSeconds: Math.floor((expiresAt - issuedAt) / 1000),
    }),
  );

  return { nonce, expiresAt };
}

export async function verifyNonceCookie(
  request: Request,
  env: Env,
): Promise<NonceToken | null> {
  const secret = getSessionSecret(env);
  if (!secret) return null;
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const token = cookies.get(NONCE_COOKIE);
  if (!token) return null;
  const payload = await verifyToken(token, secret);
  if (!payload) return null;
  if (typeof payload.address !== "string") return null;
  if (typeof payload.nonce !== "string") return null;
  if (typeof payload.issuedAt !== "number") return null;
  if (typeof payload.expiresAt !== "number") return null;
  if (Date.now() > payload.expiresAt) return null;
  return {
    address: payload.address,
    nonce: payload.nonce,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  };
}

export async function issueSession(
  headers: Headers,
  env: Env,
  requestUrl: string,
  address: string,
): Promise<void> {
  const secret = getSessionSecret(env);
  if (!secret) throw new Error("SESSION_SECRET is required to create sessions");
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 14 * 24 * 60 * 60_000;
  const token = await signToken(
    { address, issuedAt, expiresAt } satisfies Session,
    secret,
  );
  const secure = shouldUseSecureCookies(env, requestUrl);
  headers.append(
    "set-cookie",
    serializeCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      maxAgeSeconds: Math.floor((expiresAt - issuedAt) / 1000),
    }),
  );
}

export async function clearSession(
  headers: Headers,
  env: Env,
  requestUrl: string,
): Promise<void> {
  const secure = shouldUseSecureCookies(env, requestUrl);
  headers.append(
    "set-cookie",
    serializeCookie(SESSION_COOKIE, "", {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      maxAgeSeconds: 0,
    }),
  );
}

export async function readSession(
  request: Request,
  env: Env,
): Promise<Session | null> {
  const secret = getSessionSecret(env);
  if (!secret) return null;
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null;
  const payload = await verifyToken(token, secret);
  if (!payload) return null;
  if (typeof payload.address !== "string") return null;
  if (typeof payload.issuedAt !== "number") return null;
  if (typeof payload.expiresAt !== "number") return null;
  if (Date.now() > payload.expiresAt) return null;
  return {
    address: payload.address,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  };
}

export type GateResult = {
  eligible: boolean;
  reason?: string;
  expiresAt: string;
};

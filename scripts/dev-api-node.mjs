import http from "node:http";
import { URL } from "node:url";

function setDefaultEnv() {
  process.env.SESSION_SECRET ??= "dev-secret";
  process.env.DEV_BYPASS_SIGNATURE ??= "false";
  process.env.DEV_BYPASS_GATE ??= "false";
  process.env.DEV_INSECURE_COOKIES ??= "true";
  process.env.READ_MODELS_INLINE ??= "true";
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function resolveRoute(pathname) {
  const patterns = [
    ["GET", /^\/api\/health$/, () => import("../functions/api/health.ts")],
    ["GET", /^\/api\/me$/, () => import("../functions/api/me.ts")],
    [
      "GET",
      /^\/api\/gate\/status$/,
      () => import("../functions/api/gate/status.ts"),
    ],
    [
      "POST",
      /^\/api\/auth\/nonce$/,
      () => import("../functions/api/auth/nonce.ts"),
    ],
    [
      "POST",
      /^\/api\/auth\/verify$/,
      () => import("../functions/api/auth/verify.ts"),
    ],
    [
      "POST",
      /^\/api\/auth\/logout$/,
      () => import("../functions/api/auth/logout.ts"),
    ],
    ["GET", /^\/api\/clock$/, () => import("../functions/api/clock/index.ts")],
    [
      "POST",
      /^\/api\/clock\/advance-era$/,
      () => import("../functions/api/clock/advance-era.ts"),
    ],
    [
      "GET",
      /^\/api\/chambers$/,
      () => import("../functions/api/chambers/index.ts"),
    ],
    [
      "GET",
      /^\/api\/chambers\/([^/]+)$/,
      () => import("../functions/api/chambers/[id].ts"),
    ],
    [
      "GET",
      /^\/api\/proposals$/,
      () => import("../functions/api/proposals/index.ts"),
    ],
    ["GET", /^\/api\/feed$/, () => import("../functions/api/feed/index.ts")],
    [
      "GET",
      /^\/api\/proposals\/([^/]+)\/pool$/,
      () => import("../functions/api/proposals/[id]/pool.ts"),
    ],
    [
      "GET",
      /^\/api\/proposals\/([^/]+)\/chamber$/,
      () => import("../functions/api/proposals/[id]/chamber.ts"),
    ],
    [
      "GET",
      /^\/api\/proposals\/([^/]+)\/formation$/,
      () => import("../functions/api/proposals/[id]/formation.ts"),
    ],
    [
      "GET",
      /^\/api\/courts$/,
      () => import("../functions/api/courts/index.ts"),
    ],
    [
      "GET",
      /^\/api\/courts\/([^/]+)$/,
      () => import("../functions/api/courts/[id].ts"),
    ],
    [
      "GET",
      /^\/api\/humans$/,
      () => import("../functions/api/humans/index.ts"),
    ],
    [
      "GET",
      /^\/api\/humans\/([^/]+)$/,
      () => import("../functions/api/humans/[id].ts"),
    ],
  ];

  for (const [method, re, load] of patterns) {
    const match = pathname.match(re);
    if (!match) continue;
    return {
      method,
      load,
      params: match[1] ? { id: match[1] } : {},
    };
  }
  return null;
}

function getSetCookieHeaders(headers) {
  const getSetCookie = headers?.getSetCookie?.bind(headers);
  if (getSetCookie) return getSetCookie();
  const v = headers?.get?.("set-cookie");
  return v ? [v] : [];
}

async function handleRequest(nodeReq, nodeRes) {
  const origin = `http://${nodeReq.headers.host ?? "127.0.0.1"}`;
  const url = new URL(nodeReq.url ?? "/", origin);

  const route = resolveRoute(url.pathname);
  if (!route) {
    nodeRes.statusCode = 404;
    nodeRes.setHeader("content-type", "application/json");
    nodeRes.end(JSON.stringify({ error: { message: "Not found" } }));
    return;
  }

  if (nodeReq.method !== route.method) {
    nodeRes.statusCode = 405;
    nodeRes.setHeader("content-type", "application/json");
    nodeRes.end(JSON.stringify({ error: { message: "Method not allowed" } }));
    return;
  }

  const body = await readBody(nodeReq);
  const request = new Request(url.toString(), {
    method: nodeReq.method,
    headers: nodeReq.headers,
    body: body.length ? body : undefined,
  });

  const mod = await route.load();
  const handler =
    nodeReq.method === "POST" ? mod.onRequestPost : mod.onRequestGet;

  if (typeof handler !== "function") {
    nodeRes.statusCode = 500;
    nodeRes.setHeader("content-type", "application/json");
    nodeRes.end(
      JSON.stringify({ error: { message: "Handler not implemented" } }),
    );
    return;
  }

  const env = { ...process.env };
  const response = await handler({ request, env, params: route.params });

  nodeRes.statusCode = response.status;

  const setCookies = getSetCookieHeaders(response.headers);
  for (const cookie of setCookies) {
    nodeRes.appendHeader?.("set-cookie", cookie);
  }
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") continue;
    nodeRes.setHeader(key, value);
  }

  const arrayBuffer = await response.arrayBuffer();
  nodeRes.end(Buffer.from(arrayBuffer));
}

setDefaultEnv();

const port = Number(process.env.API_PORT ?? "8788");
const host = process.env.API_HOST ?? "127.0.0.1";

const server = http.createServer((req, res) => {
  void handleRequest(req, res).catch((err) => {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({ error: { message: err?.message ?? String(err) } }),
    );
  });
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://${host}:${port}`);
});

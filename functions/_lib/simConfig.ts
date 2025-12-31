type SimConfig = {
  humanodeRpcUrl?: string;
  genesisChamberMembers?: Record<string, string[]>;
};

let cached:
  | {
      value: SimConfig | null;
      expiresAtMs: number;
    }
  | undefined;

function asGenesisMembers(
  value: unknown,
): Record<string, string[]> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;

  const out: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(record)) {
    if (!Array.isArray(raw)) continue;
    const list = raw
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => v.toLowerCase());
    if (list.length > 0) out[key.trim().toLowerCase()] = list;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseSimConfig(json: unknown): SimConfig | null {
  if (!json || typeof json !== "object") return null;
  const value = json as Record<string, unknown>;
  return {
    humanodeRpcUrl:
      typeof value.humanodeRpcUrl === "string"
        ? value.humanodeRpcUrl
        : undefined,
    genesisChamberMembers: asGenesisMembers(value.genesisChamberMembers),
  };
}

export async function getSimConfig(
  env: Record<string, string | undefined>,
  requestUrl: string,
): Promise<SimConfig | null> {
  const rawOverride = (env.SIM_CONFIG_JSON ?? "").trim();
  if (rawOverride) {
    try {
      const json = JSON.parse(rawOverride) as unknown;
      return parseSimConfig(json);
    } catch {
      return null;
    }
  }
  return getSimConfigFromOrigin(requestUrl);
}

export async function getSimConfigFromOrigin(
  requestUrl: string,
): Promise<SimConfig | null> {
  const now = Date.now();
  if (cached && cached.expiresAtMs > now) return cached.value;

  const origin = new URL(requestUrl).origin;
  try {
    const res = await fetch(`${origin}/sim-config.json`, { method: "GET" });
    if (!res.ok) {
      cached = { value: null, expiresAtMs: now + 60_000 };
      return null;
    }
    const json = (await res.json()) as unknown;
    const value = parseSimConfig(json);
    cached = { value, expiresAtMs: now + 60_000 };
    return value;
  } catch {
    cached = { value: null, expiresAtMs: now + 10_000 };
    return null;
  }
}

type SimConfig = {
  humanodeRpcUrl?: string;
  genesisChamberMembers?: Record<string, string[]>;
  genesisChambers?: { id: string; title: string; multiplier: number }[];
  genesisUserTiers?: Record<
    string,
    "Nominee" | "Ecclesiast" | "Legate" | "Consul" | "Citizen"
  >;
};

let cached:
  | {
      value: SimConfig | null;
      expiresAtMs: number;
    }
  | undefined;

function asUserTiers(
  value: unknown,
): SimConfig["genesisUserTiers"] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const out: NonNullable<SimConfig["genesisUserTiers"]> = {};
  for (const [rawKey, rawValue] of Object.entries(record)) {
    const address = rawKey.trim();
    if (!address) continue;
    if (typeof rawValue !== "string") continue;
    const tier = rawValue.trim();
    if (
      tier !== "Nominee" &&
      tier !== "Ecclesiast" &&
      tier !== "Legate" &&
      tier !== "Consul" &&
      tier !== "Citizen"
    )
      continue;
    out[address] = tier;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

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
      .filter(Boolean);
    if (list.length > 0) out[key.trim().toLowerCase()] = list;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseSimConfig(json: unknown): SimConfig | null {
  if (!json || typeof json !== "object") return null;
  const value = json as Record<string, unknown>;
  const genesisChambersRaw = value.genesisChambers;
  const genesisChambers = Array.isArray(genesisChambersRaw)
    ? genesisChambersRaw
        .filter((row): row is Record<string, unknown> => {
          return Boolean(row && typeof row === "object" && !Array.isArray(row));
        })
        .map((row) => ({
          id: typeof row.id === "string" ? row.id.trim().toLowerCase() : "",
          title:
            typeof row.title === "string"
              ? row.title.trim()
              : typeof row.name === "string"
                ? row.name.trim()
                : "",
          multiplier:
            typeof row.multiplier === "number"
              ? row.multiplier
              : typeof row.multiplierTimes10 === "number"
                ? row.multiplierTimes10 / 10
                : 1,
        }))
        .filter((row) => row.id && row.title)
    : undefined;
  return {
    humanodeRpcUrl:
      typeof value.humanodeRpcUrl === "string"
        ? value.humanodeRpcUrl
        : undefined,
    genesisChamberMembers: asGenesisMembers(value.genesisChamberMembers),
    genesisUserTiers: asUserTiers(value.genesisUserTiers),
    genesisChambers:
      genesisChambers && genesisChambers.length > 0
        ? genesisChambers
        : undefined,
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

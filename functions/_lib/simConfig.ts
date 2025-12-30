type SimConfig = {
  humanodeRpcUrl?: string;
};

let cached:
  | {
      value: SimConfig | null;
      expiresAtMs: number;
    }
  | undefined;

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
    const value =
      json && typeof json === "object"
        ? ({
            humanodeRpcUrl:
              typeof (json as SimConfig).humanodeRpcUrl === "string"
                ? (json as SimConfig).humanodeRpcUrl
                : undefined,
          } satisfies SimConfig)
        : null;
    cached = { value, expiresAtMs: now + 60_000 };
    return value;
  } catch {
    cached = { value: null, expiresAtMs: now + 10_000 };
    return null;
  }
}

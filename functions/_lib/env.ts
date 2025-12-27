export function envBoolean(
  env: Record<string, string | undefined>,
  key: string,
): boolean {
  const raw = env[key];
  if (!raw) return false;
  return (
    raw === "1" || raw.toLowerCase() === "true" || raw.toLowerCase() === "yes"
  );
}

export function envString(
  env: Record<string, string | undefined>,
  key: string,
): string | undefined {
  const raw = env[key];
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

export function envCsv(
  env: Record<string, string | undefined>,
  key: string,
): string[] {
  const raw = envString(env, key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function envInt(
  env: Record<string, string | undefined>,
  key: string,
): number | undefined {
  const raw = envString(env, key);
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

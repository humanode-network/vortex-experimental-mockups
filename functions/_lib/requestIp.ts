export function getRequestIp(request: Request): string | undefined {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = request.headers.get("x-forwarded-for");
  if (!xff) return undefined;
  return xff.split(",")[0]?.trim() || undefined;
}

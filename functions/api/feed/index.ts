import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { base64UrlDecode, base64UrlEncode } from "../../_lib/base64url.ts";

const DEFAULT_PAGE_SIZE = 25;

function decodeCursor(input: string): { ts: string; id: string } | null {
  try {
    const bytes = base64UrlDecode(input);
    const raw = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(raw) as { ts?: unknown; id?: unknown };
    if (typeof parsed.ts !== "string" || typeof parsed.id !== "string")
      return null;
    return { ts: parsed.ts, id: parsed.id };
  } catch {
    return null;
  }
}

function encodeCursor(input: { ts: string; id: string }): string {
  const raw = JSON.stringify(input);
  const bytes = new TextEncoder().encode(raw);
  return base64UrlEncode(bytes);
}

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const store = await createReadModelsStore(context.env);
    const payload = await store.get("feed:list");
    if (!payload) return jsonResponse({ items: [] });

    const url = new URL(context.request.url);
    const stage = url.searchParams.get("stage");
    const cursor = url.searchParams.get("cursor");

    const typed = payload as {
      items?: { id: string; stage: string; timestamp: string }[];
    };
    let items = [...(typed.items ?? [])];

    if (stage) items = items.filter((item) => item.stage === stage);

    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) return errorResponse(400, "Invalid cursor");
      const idx = items.findIndex(
        (item) => item.timestamp === decoded.ts && item.id === decoded.id,
      );
      if (idx >= 0) items = items.slice(idx + 1);
    }

    const page = items.slice(0, DEFAULT_PAGE_SIZE);
    const next =
      items.length > DEFAULT_PAGE_SIZE
        ? encodeCursor({
            ts: page[page.length - 1]?.timestamp ?? "",
            id: page[page.length - 1]?.id ?? "",
          })
        : undefined;

    const response = next ? { items: page, nextCursor: next } : { items: page };
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

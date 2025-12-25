import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { base64UrlDecode, base64UrlEncode } from "../../_lib/base64url.ts";
import { listFeedEventsPage } from "../../_lib/eventsStore.ts";

const DEFAULT_PAGE_SIZE = 25;

type Cursor =
  | { kind: "read_models"; ts: string; id: string }
  | { kind: "events"; seq: number };

function decodeCursor(input: string): Cursor | null {
  try {
    const bytes = base64UrlDecode(input);
    const raw = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(raw) as {
      ts?: unknown;
      id?: unknown;
      seq?: unknown;
    };
    if (typeof parsed.seq === "number" && Number.isFinite(parsed.seq)) {
      return { kind: "events", seq: parsed.seq };
    }
    if (typeof parsed.ts === "string" && typeof parsed.id === "string") {
      return { kind: "read_models", ts: parsed.ts, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

function encodeCursor(input: { ts: string; id: string } | { seq: number }) {
  const raw = JSON.stringify(input);
  const bytes = new TextEncoder().encode(raw);
  return base64UrlEncode(bytes);
}

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const stage = url.searchParams.get("stage");
    const cursor = url.searchParams.get("cursor");
    const decoded = cursor ? decodeCursor(cursor) : null;
    if (cursor && !decoded) return errorResponse(400, "Invalid cursor");

    const wantsInlineReadModels = context.env.READ_MODELS_INLINE === "true";
    const hasDatabase = Boolean(context.env.DATABASE_URL);

    if (hasDatabase && !wantsInlineReadModels) {
      if (decoded && decoded.kind !== "events") {
        return errorResponse(400, "Invalid cursor");
      }
      const beforeSeq = decoded?.seq ?? null;
      const page = await listFeedEventsPage(context.env, {
        stage,
        beforeSeq,
        limit: DEFAULT_PAGE_SIZE,
      });
      const nextCursor =
        page.nextSeq !== undefined
          ? encodeCursor({ seq: page.nextSeq })
          : undefined;
      return jsonResponse(
        nextCursor ? { items: page.items, nextCursor } : { items: page.items },
      );
    }

    const store = await createReadModelsStore(context.env);
    const payload = await store.get("feed:list");
    if (!payload) return jsonResponse({ items: [] });
    if (decoded && decoded.kind !== "read_models") {
      return errorResponse(400, "Invalid cursor");
    }

    const typed = payload as {
      items?: { id: string; stage: string; timestamp: string }[];
    };
    let items = [...(typed.items ?? [])];

    if (stage) items = items.filter((item) => item.stage === stage);

    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    if (decoded?.kind === "read_models") {
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

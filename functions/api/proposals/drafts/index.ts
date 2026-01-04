import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { readSession } from "../../../_lib/auth.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import {
  listDrafts,
  formatChamberLabel,
} from "../../../_lib/proposalDraftsStore.ts";
import { getUserTier } from "../../../_lib/userTier.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const session = await readSession(context.request, context.env);

    if (!context.env.DATABASE_URL) {
      if (session) {
        const tier = await getUserTier(
          context.env,
          context.request.url,
          session.address,
        );
        const drafts = await listDrafts(context.env, {
          authorAddress: session.address,
        });
        return jsonResponse({
          items: drafts.map((d) => ({
            id: d.id,
            title: d.title,
            chamber: formatChamberLabel(d.chamberId),
            tier,
            summary: d.summary,
            updated: d.updatedAt.toISOString().slice(0, 10),
          })),
        });
      }

      const store = await createReadModelsStore(context.env);
      const payload = await store.get("proposals:drafts:list");
      return jsonResponse(payload ?? { items: [] });
    }

    if (!session) return jsonResponse({ items: [] });
    const tier = await getUserTier(
      context.env,
      context.request.url,
      session.address,
    );
    const drafts = await listDrafts(context.env, {
      authorAddress: session.address,
    });
    return jsonResponse({
      items: drafts.map((d) => ({
        id: d.id,
        title: d.title,
        chamber: formatChamberLabel(d.chamberId),
        tier,
        summary: d.summary,
        updated: d.updatedAt.toISOString().slice(0, 10),
      })),
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

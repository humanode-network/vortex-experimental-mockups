import { createReadModelsStore } from "../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { getAcmDelta } from "../../_lib/cmAwardsStore.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing human id");
    const store = await createReadModelsStore(context.env);
    const payload = await store.get(`humans:${id}`);
    if (!payload) return errorResponse(404, `Missing read model: humans:${id}`);

    const delta = await getAcmDelta(context.env, id);
    if (!delta) return jsonResponse(payload);

    const typed = payload as Record<string, unknown>;
    const heroStats = Array.isArray(typed.heroStats)
      ? (typed.heroStats as Array<Record<string, unknown>>)
      : [];
    const nextHeroStats = heroStats.map((stat) => {
      if (stat.label !== "ACM") return stat;
      const raw = typeof stat.value === "string" ? stat.value : "0";
      const base = Number(raw.replace(/,/g, "")) || 0;
      return { ...stat, value: String(base + delta) };
    });

    return jsonResponse({ ...typed, heroStats: nextHeroStats });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

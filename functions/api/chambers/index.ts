import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import {
  listChambers,
  projectChamberPipeline,
  projectChamberStats,
} from "../../_lib/chambersStore.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    if (context.env.READ_MODELS_INLINE_EMPTY === "true") {
      return jsonResponse({ items: [] });
    }
    const url = new URL(context.request.url);
    const includeDissolved =
      url.searchParams.get("includeDissolved") === "true";
    const chambers = await listChambers(context.env, context.request.url, {
      includeDissolved,
    });
    const items = await Promise.all(
      chambers.map(async (chamber) => {
        const pipeline = await projectChamberPipeline(context.env, {
          chamberId: chamber.id,
        });
        const stats = await projectChamberStats(
          context.env,
          context.request.url,
          { chamberId: chamber.id },
        );
        return {
          id: chamber.id,
          name: chamber.title,
          multiplier: Math.round((chamber.multiplierTimes10 / 10) * 10) / 10,
          stats: {
            governors: stats.governors.toLocaleString(),
            acm: stats.acm.toLocaleString(),
            lcm: stats.lcm.toLocaleString(),
            mcm: stats.mcm.toLocaleString(),
          },
          pipeline,
        };
      }),
    );
    return jsonResponse({ items });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

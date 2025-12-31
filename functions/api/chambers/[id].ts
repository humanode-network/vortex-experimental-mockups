import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { getChamber } from "../../_lib/chambersStore.ts";
import { createDb } from "../../_lib/db.ts";
import { proposals } from "../../../db/schema.ts";
import { eq } from "drizzle-orm";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing chamber id");
    if (context.env.READ_MODELS_INLINE_EMPTY === "true") {
      return errorResponse(404, "Chamber not found");
    }

    const chamber = await getChamber(context.env, context.request.url, id);
    if (!chamber) return errorResponse(404, "Chamber not found");

    const stageOptions = [
      { value: "upcoming", label: "Upcoming" },
      { value: "live", label: "Live" },
      { value: "ended", label: "Ended" },
    ] as const;

    const proposalsList: {
      id: string;
      title: string;
      meta: string;
      summary: string;
      lead: string;
      nextStep: string;
      timing: string;
      stage: "upcoming" | "live" | "ended";
    }[] = [];

    if (context.env.DATABASE_URL) {
      const db = createDb(context.env);
      const rows = await db
        .select({
          id: proposals.id,
          stage: proposals.stage,
          title: proposals.title,
          summary: proposals.summary,
          createdAt: proposals.createdAt,
        })
        .from(proposals)
        .where(eq(proposals.chamberId, id.toLowerCase()));
      for (const row of rows) {
        const stage =
          row.stage === "pool"
            ? "upcoming"
            : row.stage === "vote"
              ? "live"
              : "ended";
        proposalsList.push({
          id: row.id,
          title: row.title,
          meta: stage === "upcoming" ? "Proposal pool" : "Chamber vote",
          summary: row.summary,
          lead: chamber.title,
          nextStep:
            stage === "upcoming"
              ? "Cast attention vote"
              : stage === "live"
                ? "Cast chamber vote"
                : "Read outcome",
          timing: row.createdAt.toISOString().slice(0, 10),
          stage,
        });
      }
    }

    return jsonResponse({
      proposals: proposalsList,
      governors: [],
      threads: [],
      chatLog: [],
      stageOptions,
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

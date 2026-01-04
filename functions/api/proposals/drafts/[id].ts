import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { readSession } from "../../../_lib/auth.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import {
  getDraft,
  formatChamberLabel,
} from "../../../_lib/proposalDraftsStore.ts";
import { getUserTier } from "../../../_lib/userTier.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing draft id");
    const session = await readSession(context.request, context.env);

    if (!context.env.DATABASE_URL) {
      if (session) {
        const tier = await getUserTier(
          context.env,
          context.request.url,
          session.address,
        );
        const draft = await getDraft(context.env, {
          authorAddress: session.address,
          draftId: id,
        });
        if (draft) {
          const budgetTotal = draft.payload.budgetItems.reduce((sum, item) => {
            const n = Number(item.amount);
            if (!Number.isFinite(n) || n <= 0) return sum;
            return sum + n;
          }, 0);

          return jsonResponse({
            title: draft.title,
            proposer: session.address,
            chamber: formatChamberLabel(draft.chamberId),
            focus: draft.payload.chamberId
              ? "Chamber-scoped proposal"
              : "General proposal",
            tier,
            budget:
              budgetTotal > 0 ? `${budgetTotal.toLocaleString()} HMND` : "—",
            formationEligible: !draft.payload.metaGovernance,
            teamSlots: "1 / 3",
            milestonesPlanned: `${draft.payload.timeline.length} milestones`,
            summary: draft.payload.summary,
            rationale: draft.payload.why,
            budgetScope: draft.payload.budgetItems
              .filter((b) => b.description.trim().length > 0)
              .map((b) => `${b.description}: ${b.amount} HMND`)
              .join("\n"),
            invisionInsight: {
              role: "Draft author",
              bullets: [
                "This is a saved draft in the off-chain simulation backend.",
                "Submission to the pool is gated by active Humanode status.",
              ],
            },
            checklist: draft.payload.how
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .slice(0, 12),
            milestones: draft.payload.timeline
              .map((m) => m.title)
              .filter(Boolean),
            teamLocked: [
              {
                name: session.address,
                role: "Proposer",
              },
            ],
            openSlotNeeds: [
              {
                title: "Contributor (open slot)",
                desc: "Join the taskforce if the proposal reaches Formation.",
              },
            ],
            milestonesDetail: draft.payload.timeline.map((m, idx) => ({
              title: m.title.trim().length ? m.title : `Milestone ${idx + 1}`,
              desc: m.timeframe.trim().length ? m.timeframe : "Timeline TBD",
            })),
            attachments: draft.payload.attachments
              .filter((a) => a.label.trim().length > 0)
              .map((a) => ({ title: a.label, href: a.url || "#" })),
          });
        }
      }

      const store = await createReadModelsStore(context.env);
      const payload = await store.get(`proposals:drafts:${id}`);
      if (!payload)
        return errorResponse(404, `Missing read model: proposals:drafts:${id}`);
      return jsonResponse(payload);
    }

    if (!session) return errorResponse(404, "Draft not found");
    const tier = await getUserTier(
      context.env,
      context.request.url,
      session.address,
    );
    const draft = await getDraft(context.env, {
      authorAddress: session.address,
      draftId: id,
    });
    if (!draft) return errorResponse(404, "Draft not found");

    const budgetTotal = draft.payload.budgetItems.reduce((sum, item) => {
      const n = Number(item.amount);
      if (!Number.isFinite(n) || n <= 0) return sum;
      return sum + n;
    }, 0);

    return jsonResponse({
      title: draft.title,
      proposer: session.address,
      chamber: formatChamberLabel(draft.chamberId),
      focus: draft.payload.chamberId
        ? "Chamber-scoped proposal"
        : "General proposal",
      tier,
      budget: budgetTotal > 0 ? `${budgetTotal.toLocaleString()} HMND` : "—",
      formationEligible: !draft.payload.metaGovernance,
      teamSlots: "1 / 3",
      milestonesPlanned: `${draft.payload.timeline.length} milestones`,
      summary: draft.payload.summary,
      rationale: draft.payload.why,
      budgetScope: draft.payload.budgetItems
        .filter((b) => b.description.trim().length > 0)
        .map((b) => `${b.description}: ${b.amount} HMND`)
        .join("\n"),
      invisionInsight: {
        role: "Draft author",
        bullets: [
          "This is a saved draft in the off-chain simulation backend.",
          "Submission to the pool is gated by active Humanode status.",
        ],
      },
      checklist: draft.payload.how
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 12),
      milestones: draft.payload.timeline.map((m) => m.title).filter(Boolean),
      teamLocked: [
        {
          name: session.address,
          role: "Proposer",
        },
      ],
      openSlotNeeds: [
        {
          title: "Contributor (open slot)",
          desc: "Join the taskforce if the proposal reaches Formation.",
        },
      ],
      milestonesDetail: draft.payload.timeline.map((m, idx) => ({
        title: m.title.trim().length ? m.title : `Milestone ${idx + 1}`,
        desc: m.timeframe.trim().length ? m.timeframe : "Timeline TBD",
      })),
      attachments: draft.payload.attachments
        .filter((a) => a.label.trim().length > 0)
        .map((a) => ({ title: a.label, href: a.url || "#" })),
    });
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

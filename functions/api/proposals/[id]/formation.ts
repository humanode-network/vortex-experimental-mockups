import { createReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { errorResponse, jsonResponse } from "../../../_lib/http.ts";
import {
  getFormationSummary,
  listFormationJoiners,
  ensureFormationSeedFromInput,
  buildV1FormationSeedFromProposalPayload,
} from "../../../_lib/formationStore.ts";
import { getProposal } from "../../../_lib/proposalsStore.ts";
import type { ReadModelsStore } from "../../../_lib/readModelsStore.ts";
import { projectFormationProposalPage } from "../../../_lib/proposalProjector.ts";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params?.id;
    if (!id) return errorResponse(400, "Missing proposal id");

    const proposal = await getProposal(context.env, id);
    if (proposal) {
      const store: ReadModelsStore = (await createReadModelsStore(
        context.env,
      ).catch(() => null)) ?? {
        get: async () => null,
      };

      const formationEligible = (() => {
        const payload = proposal.payload;
        if (!payload || typeof payload !== "object" || Array.isArray(payload))
          return true;
        const record = payload as Record<string, unknown>;
        if (record.templateId === "system") return false;
        if (
          typeof record.metaGovernance === "object" &&
          record.metaGovernance !== null &&
          !Array.isArray(record.metaGovernance)
        )
          return false;
        if (typeof record.formationEligible === "boolean")
          return record.formationEligible;
        if (typeof record.formation === "boolean") return record.formation;
        return true;
      })();

      if (!formationEligible) {
        return jsonResponse(
          projectFormationProposalPage(proposal, {
            summary: {
              teamFilled: 0,
              teamTotal: 0,
              milestonesCompleted: 0,
              milestonesTotal: 0,
            },
            joiners: [],
          }),
        );
      }

      if (formationEligible) {
        const seed = buildV1FormationSeedFromProposalPayload(proposal.payload);
        await ensureFormationSeedFromInput(context.env, {
          proposalId: id,
          seed,
        });
      }

      const summary = await getFormationSummary(context.env, store, id);
      const joiners = await listFormationJoiners(context.env, id);
      return jsonResponse(
        projectFormationProposalPage(proposal, { summary, joiners }),
      );
    }

    const store = await createReadModelsStore(context.env);
    const readModelKey = `proposals:${id}:formation`;
    const payload = await store.get(readModelKey);
    if (!payload)
      return errorResponse(404, `Missing read model: ${readModelKey}`);

    const summary = await getFormationSummary(context.env, store, id);
    const joiners = await listFormationJoiners(context.env, id);

    const next = patchFormationReadModel(payload, {
      teamFilled: summary.teamFilled,
      teamTotal: summary.teamTotal,
      milestonesCompleted: summary.milestonesCompleted,
      milestonesTotal: summary.milestonesTotal,
      joiners,
    });

    return jsonResponse(next);
  } catch (error) {
    return errorResponse(500, (error as Error).message);
  }
};

function patchFormationReadModel(
  payload: unknown,
  input: {
    teamFilled: number;
    teamTotal: number;
    milestonesCompleted: number;
    milestonesTotal: number;
    joiners: { address: string; role?: string | null }[];
  },
): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const teamSlots = `${input.teamFilled} / ${input.teamTotal}`;
  const milestones = `${input.milestonesCompleted} / ${input.milestonesTotal}`;
  const progress =
    input.milestonesTotal > 0
      ? `${Math.round((input.milestonesCompleted / input.milestonesTotal) * 100)}%`
      : "0%";

  const baseTeam = Array.isArray(record.lockedTeam) ? record.lockedTeam : [];
  const joinerItems = input.joiners.map((entry) => ({
    name: shortenAddress(entry.address),
    role: entry.role ?? "Contributor",
  }));

  const stageData = Array.isArray(record.stageData) ? record.stageData : [];
  const nextStageData = stageData.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return entry;
    const row = entry as Record<string, unknown>;
    const title = String(row.title ?? "").toLowerCase();
    if (title.includes("team slots")) return { ...row, value: teamSlots };
    if (title.includes("milestones")) return { ...row, value: milestones };
    return entry;
  });

  return {
    ...record,
    teamSlots,
    milestones,
    progress,
    stageData: nextStageData,
    lockedTeam: [...baseTeam, ...joinerItems],
  };
}

function shortenAddress(address: string): string {
  const normalized = address.trim();
  if (normalized.length <= 12) return normalized;
  return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
}

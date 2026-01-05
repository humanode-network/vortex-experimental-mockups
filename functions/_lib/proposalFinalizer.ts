import { getChamberYesScoreAverage } from "./chamberVotesStore.ts";
import { awardCmOnce } from "./cmAwardsStore.ts";
import {
  createChamberFromAcceptedGeneralProposal,
  dissolveChamberFromAcceptedGeneralProposal,
  getChamberMultiplierTimes10 as getCanonicalChamberMultiplierTimes10,
  parseChamberGovernanceFromPayload,
} from "./chambersStore.ts";
import {
  buildV1FormationSeedFromProposalPayload,
  ensureFormationSeedFromInput,
} from "./formationStore.ts";
import {
  grantVotingEligibilityForAcceptedProposal,
  ensureChamberMembership,
} from "./chamberMembershipsStore.ts";
import { appendProposalTimelineItem } from "./proposalTimelineStore.ts";
import {
  clearProposalVotePendingVeto,
  getProposal,
  transitionProposalStage,
} from "./proposalsStore.ts";
import { randomHex } from "./random.ts";

type Env = Record<string, string | undefined>;

function getFormationEligibleFromProposalPayload(payload: unknown): boolean {
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
}

export async function finalizeAcceptedProposalFromVote(
  env: Env,
  input: { proposalId: string; requestUrl: string },
): Promise<
  | {
      ok: true;
      formationEligible: boolean;
      avgScore: number | null;
      proposalChamberId: string;
    }
  | { ok: false; reason: string }
> {
  const proposal = await getProposal(env, input.proposalId);
  if (!proposal) return { ok: false, reason: "missing_proposal" };
  if (proposal.stage !== "vote") return { ok: false, reason: "stage_invalid" };

  const transitioned = await transitionProposalStage(env, {
    proposalId: input.proposalId,
    from: "vote",
    to: "build",
  });
  if (!transitioned) return { ok: false, reason: "transition_failed" };

  await clearProposalVotePendingVeto(env, { proposalId: proposal.id }).catch(
    () => {},
  );

  await grantVotingEligibilityForAcceptedProposal(env, {
    address: proposal.authorAddress,
    chamberId: proposal.chamberId ?? null,
    proposalId: proposal.id,
  });

  const proposalChamberId = (() => {
    const raw = (proposal.chamberId ?? "general").trim();
    return raw ? raw.toLowerCase() : "general";
  })();
  const meta = parseChamberGovernanceFromPayload(proposal.payload);
  const effectiveChamberId = meta ? "general" : proposalChamberId;

  if (effectiveChamberId === "general" && meta) {
    if (meta.action === "chamber.create" && meta.title) {
      await createChamberFromAcceptedGeneralProposal(env, input.requestUrl, {
        id: meta.id,
        title: meta.title,
        multiplier: meta.multiplier,
        proposalId: proposal.id,
      });

      await appendProposalTimelineItem(env, {
        proposalId: proposal.id,
        stage: "build",
        actorAddress: null,
        item: {
          id: `timeline:chamber-created:${proposal.id}:${randomHex(4)}`,
          type: "chamber.created",
          title: "Chamber created",
          detail: `${meta.id} (${meta.title})`,
          actor: "system",
          timestamp: new Date().toISOString(),
        },
      });

      const genesisMembers = (() => {
        if (!proposal.payload || typeof proposal.payload !== "object")
          return [];
        const record = proposal.payload as Record<string, unknown>;
        const mg = record.metaGovernance;
        if (!mg || typeof mg !== "object" || Array.isArray(mg)) return [];
        const metaRecord = mg as Record<string, unknown>;
        const raw = metaRecord.genesisMembers;
        if (!Array.isArray(raw)) return [];
        return raw
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim())
          .filter(Boolean);
      })();

      const memberSet = new Set<string>(genesisMembers);
      memberSet.add(proposal.authorAddress.trim());
      for (const address of memberSet) {
        await ensureChamberMembership(env, {
          address,
          chamberId: meta.id,
          grantedByProposalId: proposal.id,
          source: "chamber_genesis",
        });
      }
    }
    if (meta.action === "chamber.dissolve") {
      await dissolveChamberFromAcceptedGeneralProposal(env, input.requestUrl, {
        id: meta.id,
        proposalId: proposal.id,
      });

      await appendProposalTimelineItem(env, {
        proposalId: proposal.id,
        stage: "build",
        actorAddress: null,
        item: {
          id: `timeline:chamber-dissolved:${proposal.id}:${randomHex(4)}`,
          type: "chamber.dissolved",
          title: "Chamber dissolved",
          detail: meta.id,
          actor: "system",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  const formationEligible = getFormationEligibleFromProposalPayload(
    proposal.payload,
  );
  if (formationEligible) {
    const seed = buildV1FormationSeedFromProposalPayload(proposal.payload);
    await ensureFormationSeedFromInput(env, {
      proposalId: input.proposalId,
      seed,
    });
  }

  const avgScore =
    (await getChamberYesScoreAverage(env, input.proposalId)) ?? null;
  const multiplierTimes10 =
    (await getCanonicalChamberMultiplierTimes10(
      env,
      input.requestUrl,
      proposalChamberId,
    )) ?? 10;

  if (avgScore !== null) {
    const lcmPoints = Math.round(avgScore * 10);
    const mcmPoints = Math.round((lcmPoints * multiplierTimes10) / 10);
    await awardCmOnce(env, {
      proposalId: input.proposalId,
      proposerId: proposal.authorAddress,
      chamberId: proposalChamberId,
      avgScore,
      lcmPoints,
      chamberMultiplierTimes10: multiplierTimes10,
      mcmPoints,
    });
  }

  return {
    ok: true,
    formationEligible,
    avgScore,
    proposalChamberId,
  };
}

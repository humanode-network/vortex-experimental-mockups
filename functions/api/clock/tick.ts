import { assertAdmin, createClockStore } from "../../_lib/clockStore.ts";
import { errorResponse, jsonResponse } from "../../_lib/http.ts";
import { appendFeedItemEventOnce } from "../../_lib/appendEvents.ts";
import { rollupEra } from "../../_lib/eraRollupStore.ts";
import {
  ensureEraSnapshot,
  setEraSnapshotActiveGovernors,
} from "../../_lib/eraStore.ts";
import { formatChamberLabel } from "../../_lib/proposalDraftsStore.ts";
import { listProposals } from "../../_lib/proposalsStore.ts";
import {
  getSimNow,
  getStageDeadlineIso,
  getStageWindowSeconds,
  isStageOpen,
  stageWindowsEnabled,
} from "../../_lib/stageWindows.ts";
import { V1_ERA_SECONDS_DEFAULT } from "../../_lib/v1Constants.ts";
import { finalizeAcceptedProposalFromVote } from "../../_lib/proposalFinalizer.ts";
import { appendProposalTimelineItem } from "../../_lib/proposalTimelineStore.ts";
import { randomHex } from "../../_lib/random.ts";

type Env = Record<string, string | undefined>;

function getEraSeconds(env: Env): number {
  const raw = env.SIM_ERA_SECONDS ?? "";
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return V1_ERA_SECONDS_DEFAULT;
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    assertAdmin(context);

    const contentType = context.request.headers.get("content-type") ?? "";
    const body = contentType.toLowerCase().includes("application/json")
      ? ((await context.request.json().catch(() => null)) as {
          forceAdvance?: boolean;
          rollup?: boolean;
        } | null)
      : null;

    const forceAdvance = body?.forceAdvance === true;
    const shouldRollup = body?.rollup !== false;

    const clock = createClockStore(context.env);
    const snapshot = await clock.get();
    await ensureEraSnapshot(context.env, snapshot.currentEra).catch(() => {});

    const now = getSimNow(context.env);
    const eraSeconds = getEraSeconds(context.env);
    const updatedAt = new Date(snapshot.updatedAt);
    const dueByTime =
      Number.isFinite(updatedAt.getTime()) &&
      now.getTime() - updatedAt.getTime() >= eraSeconds * 1000;

    const due = forceAdvance || dueByTime;

    const rollup = shouldRollup
      ? await rollupEra(context.env, {
          era: snapshot.currentEra,
          requestUrl: context.request.url,
        })
      : null;

    if (rollup) {
      await setEraSnapshotActiveGovernors(context.env, {
        era: snapshot.currentEra + 1,
        activeGovernors: rollup.activeGovernorsNextEra,
      }).catch(() => {});
    }

    let advancedTo = snapshot.currentEra;
    let advanced = false;
    if (due) {
      const next = await clock.advanceEra();
      advancedTo = next.currentEra;
      advanced = advancedTo !== snapshot.currentEra;
      await ensureEraSnapshot(context.env, next.currentEra).catch(() => {});
    }

    const endedWindows: Array<{
      proposalId: string;
      stage: "pool" | "vote";
      endedAt: string;
      emitted: boolean;
    }> = [];

    if (stageWindowsEnabled(context.env)) {
      const proposals = await listProposals(context.env).catch(() => []);
      for (const proposal of proposals) {
        if (proposal.stage !== "pool" && proposal.stage !== "vote") continue;
        if (proposal.stage === "vote" && proposal.votePassedAt) continue;
        const windowSeconds = getStageWindowSeconds(
          context.env,
          proposal.stage,
        );
        if (windowSeconds <= 0) continue;

        const stageStartedAt = proposal.updatedAt;
        if (now.getTime() < stageStartedAt.getTime()) continue;
        const endedAt = getStageDeadlineIso({ stageStartedAt, windowSeconds });
        const open = isStageOpen({ now, stageStartedAt, windowSeconds });
        if (open) continue;

        const entityType = "proposal.stage_window_ended.v1";
        const entityId = `${proposal.id}:${proposal.stage}:${endedAt}`;

        const chamberLabel = proposal.chamberId
          ? formatChamberLabel(proposal.chamberId)
          : "General chamber";

        const emitted = await appendFeedItemEventOnce(context.env, {
          stage: proposal.stage,
          entityType,
          entityId,
          payload: {
            id: `proposal-window-ended:${proposal.id}:${proposal.stage}:${endedAt}`,
            title:
              proposal.stage === "pool"
                ? "Proposal pool window ended"
                : "Chamber voting window ended",
            meta: `${chamberLabel} · System`,
            stage: proposal.stage,
            summaryPill:
              proposal.stage === "pool" ? "Proposal pool" : "Chamber vote",
            summary:
              proposal.stage === "pool"
                ? "Pool voting is now closed for this proposal."
                : "Voting is now closed for this proposal.",
            ctaPrimary: "Open proposal",
            href:
              proposal.stage === "pool"
                ? `/app/proposals/${proposal.id}/pp`
                : `/app/proposals/${proposal.id}/chamber`,
            timestamp: endedAt,
          },
        });

        endedWindows.push({
          proposalId: proposal.id,
          stage: proposal.stage,
          endedAt,
          emitted,
        });
      }
    }

    const finalized: Array<{ proposalId: string; ok: boolean }> = [];
    {
      const proposals = await listProposals(context.env, {
        stage: "vote",
      }).catch(() => []);
      for (const proposal of proposals) {
        const finalizesAt = proposal.voteFinalizesAt;
        if (!finalizesAt) continue;
        if (now.getTime() < finalizesAt.getTime()) continue;
        if (!proposal.votePassedAt) continue;

        const result = await finalizeAcceptedProposalFromVote(context.env, {
          proposalId: proposal.id,
          requestUrl: context.request.url,
        });
        finalized.push({ proposalId: proposal.id, ok: result.ok });
        if (!result.ok) continue;

        await appendFeedItemEventOnce(context.env, {
          stage: "build",
          entityType: "proposal",
          entityId: `vote-finalized:${proposal.id}:${finalizesAt.toISOString()}`,
          payload: {
            id: `vote-finalized:${proposal.id}:${finalizesAt.toISOString()}`,
            title: "Proposal accepted",
            meta: "Chamber vote",
            stage: "build",
            summaryPill: "Accepted",
            summary:
              "Veto window ended; chamber vote is finalized and the proposal is now accepted.",
            stats: [
              ...(result.avgScore !== null
                ? [{ label: "Avg CM", value: result.avgScore.toFixed(1) }]
                : []),
            ],
            ctaPrimary: "Open proposal",
            href: result.formationEligible
              ? `/app/proposals/${proposal.id}/formation`
              : `/app/proposals/${proposal.id}/chamber`,
            timestamp: now.toISOString(),
          },
        });

        await appendProposalTimelineItem(context.env, {
          proposalId: proposal.id,
          stage: "build",
          actorAddress: null,
          item: {
            id: `timeline:vote-finalized:${proposal.id}:${randomHex(4)}`,
            type: "proposal.vote.finalized",
            title: "Proposal accepted",
            detail: "Veto window ended",
            actor: "system",
            timestamp: now.toISOString(),
          },
        });
      }
    }

    return jsonResponse({
      ok: true as const,
      now: now.toISOString(),
      eraSeconds,
      due,
      advanced,
      fromEra: snapshot.currentEra,
      toEra: advancedTo,
      ...(endedWindows.length > 0 ? { endedWindows } : {}),
      ...(finalized.length > 0 ? { finalized } : {}),
      ...(rollup ? { rollup } : {}),
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    if (err.status) return errorResponse(err.status, err.message);
    return errorResponse(500, err.message);
  }
};

import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { VoteButton } from "@/components/VoteButton";
import { Modal } from "@/components/Modal";
import {
  ProposalInvisionInsightCard,
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
  ProposalTimelineCard,
} from "@/components/ProposalSections";
import {
  apiPoolVote,
  apiProposalPoolPage,
  apiProposalTimeline,
} from "@/lib/apiClient";
import type { PoolProposalPageDto, ProposalTimelineItemDto } from "@/types/api";
import { useAuth } from "@/app/auth/AuthContext";

const ProposalPP: React.FC = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<PoolProposalPageDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "upvote" | "downvote" | null
  >(null);
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          apiProposalPoolPage(id),
          apiProposalTimeline(id),
        ]);
        if (!active) return;
        if (pageResult.status === "fulfilled") {
          setProposal(pageResult.value);
          setLoadError(null);
        } else {
          setProposal(null);
          setLoadError(pageResult.reason?.message ?? "Failed to load proposal");
        }
        if (timelineResult.status === "fulfilled") {
          setTimeline(timelineResult.value.items);
          setTimelineError(null);
        } else {
          setTimeline([]);
          setTimelineError(
            timelineResult.reason?.message ?? "Failed to load timeline",
          );
        }
      } catch (error) {
        if (!active) return;
        setProposal(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (!proposal) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="proposals" />
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {loadError
            ? `Proposal unavailable: ${loadError}`
            : "Loading proposal…"}
        </Surface>
      </div>
    );
  }

  const [filledSlots, totalSlots] = proposal.teamSlots
    .split("/")
    .map((v) => Number(v.trim()));
  const openSlots = Math.max(totalSlots - filledSlots, 0);

  const votingAllowed =
    !auth.enabled || (auth.authenticated && auth.eligible && !auth.loading);

  const activeGovernors = Math.max(1, proposal.activeGovernors);
  const engaged = proposal.upvotes + proposal.downvotes;
  const attentionPercent = Math.round((engaged / activeGovernors) * 100);
  const attentionNeededPercent = Math.round(proposal.attentionQuorum * 100);
  const upvoteFloorPercent = Math.round(
    (proposal.upvoteFloor / activeGovernors) * 100,
  );
  const upvoteCurrentPercent = Math.round(
    (proposal.upvotes / activeGovernors) * 100,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="grid items-start gap-4">
        <ProposalPageHeader
          title={proposal.title}
          stage="pool"
          chamber={proposal.chamber}
          proposer={proposal.proposer}
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            <VoteButton
              size="lg"
              tone="accent"
              icon="▲"
              label="Upvote"
              disabled={!votingAllowed}
              title={
                votingAllowed
                  ? undefined
                  : auth.enabled && !auth.authenticated
                    ? "Connect your wallet to vote."
                    : (auth.gateReason ?? "Only active human nodes can vote.")
              }
              onClick={() => {
                setPendingAction("upvote");
                setRulesChecked(false);
                setVoteError(null);
                setShowRules(true);
              }}
            />
            <VoteButton
              size="lg"
              tone="destructive"
              icon="▼"
              label="Downvote"
              disabled={!votingAllowed}
              title={
                votingAllowed
                  ? undefined
                  : auth.enabled && !auth.authenticated
                    ? "Connect your wallet to vote."
                    : (auth.gateReason ?? "Only active human nodes can vote.")
              }
              onClick={() => {
                setPendingAction("downvote");
                setRulesChecked(false);
                setVoteError(null);
                setShowRules(true);
              }}
            />
          </div>
          <div className="mx-auto flex w-fit items-center gap-5 rounded-full border border-border bg-panel-alt px-14 py-7 text-2xl font-semibold text-text">
            <span className="text-accent">{proposal.upvotes} upvotes</span>
            <span className="text-muted">·</span>
            <span className="text-destructive">
              {proposal.downvotes} downvotes
            </span>
          </div>
        </ProposalPageHeader>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-text">
            Quorum of attention
          </h2>
          <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-2">
            <StatTile
              label="Attention quorum (%)"
              value={
                <>
                  {attentionPercent}% / {attentionNeededPercent}%
                </>
              }
              variant="panel"
              className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
              valueClassName="text-2xl font-semibold whitespace-nowrap"
            />
            <StatTile
              label="Upvote floor (%)"
              value={
                <>
                  {upvoteCurrentPercent}% / {upvoteFloorPercent}%
                </>
              }
              variant="panel"
              className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
              valueClassName="text-2xl font-semibold whitespace-nowrap"
            />
          </div>
        </section>
      </div>

      <ProposalSummaryCard
        summary={proposal.summary}
        stats={[
          { label: "Budget ask", value: proposal.budget },
          {
            label: "Formation",
            value: proposal.formationEligible ? "Yes" : "No",
          },
          {
            label: "Team slots",
            value: `${proposal.teamSlots} (open: ${openSlots})`,
          },
          {
            label: "Milestones",
            value: `${proposal.milestones} milestones planned`,
          },
        ]}
        overview={proposal.overview}
        executionPlan={proposal.executionPlan}
        budgetScope={proposal.budgetScope}
        attachments={proposal.attachments}
      />

      <ProposalTeamMilestonesCard
        teamLocked={proposal.teamLocked}
        openSlots={proposal.openSlotNeeds}
        milestonesDetail={proposal.milestonesDetail}
      />

      <Modal
        open={showRules}
        onOpenChange={setShowRules}
        ariaLabel="Pool rules"
        contentClassName="max-w-xl"
      >
        <Surface
          variant="panel"
          radius="2xl"
          shadow="popover"
          className="p-6 text-text"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-semibold">Pool rules</p>
            <button
              type="button"
              className="text-sm text-muted hover:text-text"
              onClick={() => setShowRules(false)}
            >
              Close
            </button>
          </div>
          <div className="space-y-2 text-sm text-muted">
            <ul className="list-disc space-y-1 pl-4">
              {proposal.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
          <Surface
            variant="panelAlt"
            radius="xl"
            shadow="control"
            className="mt-4 flex items-center gap-2 px-3 py-2"
          >
            <input
              id="rules-confirm"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={rulesChecked}
              onChange={(e) => setRulesChecked(e.target.checked)}
            />
            <label htmlFor="rules-confirm" className="text-sm text-text">
              I read the proposal and know the rules
            </label>
          </Surface>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text hover:bg-panel-alt"
              onClick={() => setShowRules(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!rulesChecked || voteSubmitting || !pendingAction}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                !rulesChecked || voteSubmitting || !pendingAction
                  ? "cursor-not-allowed bg-muted text-primary-foreground opacity-60"
                  : pendingAction === "downvote"
                    ? "border-2 border-destructive bg-destructive text-destructive-foreground hover:opacity-95"
                    : "border-2 border-accent bg-accent text-accent-foreground hover:opacity-95"
              }`}
              onClick={async () => {
                if (!id || !pendingAction) return;
                setVoteSubmitting(true);
                setVoteError(null);
                try {
                  await apiPoolVote({
                    proposalId: id,
                    direction: pendingAction === "upvote" ? "up" : "down",
                    idempotencyKey: crypto.randomUUID(),
                  });
                  const next = await apiProposalPoolPage(id);
                  setProposal(next);
                  setShowRules(false);
                } catch (error) {
                  setVoteError((error as Error).message);
                } finally {
                  setVoteSubmitting(false);
                }
              }}
            >
              {pendingAction === "downvote"
                ? voteSubmitting
                  ? "Submitting…"
                  : "Confirm downvote"
                : voteSubmitting
                  ? "Submitting…"
                  : "Confirm upvote"}
            </button>
          </div>
          {voteError ? (
            <p className="mt-3 text-sm text-destructive">{voteError}</p>
          ) : null}
        </Surface>
      </Modal>

      <ProposalInvisionInsightCard insight={proposal.invisionInsight} />

      {timelineError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Timeline unavailable: {timelineError}
        </Surface>
      ) : (
        <ProposalTimelineCard items={timeline} />
      )}
    </div>
  );
};

export default ProposalPP;

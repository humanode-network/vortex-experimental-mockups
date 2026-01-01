import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { VoteButton } from "@/components/VoteButton";
import {
  ProposalInvisionInsightCard,
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
  ProposalTimelineCard,
} from "@/components/ProposalSections";
import { Surface } from "@/components/Surface";
import {
  apiChamberVote,
  apiProposalChamberPage,
  apiProposalTimeline,
} from "@/lib/apiClient";
import type {
  ChamberProposalPageDto,
  ProposalTimelineItemDto,
} from "@/types/api";

const ProposalChamber: React.FC = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<ChamberProposalPageDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    if (!id) return;
    const page = await apiProposalChamberPage(id);
    setProposal(page);
    setLoadError(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          apiProposalChamberPage(id),
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

  const yesTotal = proposal.votes.yes;
  const noTotal = proposal.votes.no;
  const abstainTotal = proposal.votes.abstain;
  const totalVotes = yesTotal + noTotal + abstainTotal;
  const engaged = proposal.engagedGovernors;
  const quorumNeeded = Math.ceil(
    proposal.activeGovernors * proposal.attentionQuorum,
  );
  const quorumPercent = Math.round((engaged / proposal.activeGovernors) * 100);
  const quorumNeededPercent = Math.round(proposal.attentionQuorum * 100);
  const yesPercentOfQuorum =
    engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;
  const yesPercentOfTotal =
    totalVotes > 0 ? Math.round((yesTotal / totalVotes) * 100) : 0;
  const noPercentOfTotal =
    totalVotes > 0 ? Math.round((noTotal / totalVotes) * 100) : 0;
  const abstainPercentOfTotal =
    totalVotes > 0 ? Math.round((abstainTotal / totalVotes) * 100) : 0;
  const passingNeededPercent = 66.6;

  const [filledSlots, totalSlots] = proposal.teamSlots
    .split("/")
    .map((v) => Number(v.trim()));
  const openSlots = Math.max(totalSlots - filledSlots, 0);

  const handleVote = async (choice: "yes" | "no" | "abstain") => {
    if (!id || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiChamberVote({ proposalId: id, choice });
      await loadPage();
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <ProposalPageHeader
        title={proposal.title}
        stage="chamber"
        chamber={proposal.chamber}
        proposer={proposal.proposer}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <VoteButton
            tone="accent"
            label="Vote yes"
            disabled={submitting}
            onClick={() => handleVote("yes")}
          />
          <VoteButton
            tone="destructive"
            label="Vote no"
            disabled={submitting}
            onClick={() => handleVote("no")}
          />
          <VoteButton
            tone="neutral"
            label="Abstain"
            disabled={submitting}
            onClick={() => handleVote("abstain")}
          />
        </div>
        {submitError ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            {submitError}
          </Surface>
        ) : null}
      </ProposalPageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Voting quorum</h2>
        <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Voting quorum (%)"
            value={
              <>
                <span className="whitespace-nowrap">
                  {quorumPercent}% / {quorumNeededPercent}%
                </span>
                <span className="text-xs font-semibold whitespace-nowrap text-muted">
                  {engaged} / {quorumNeeded}
                </span>
              </>
            }
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
          />
          <StatTile
            label="Vote split (%)"
            value={
              <>
                <span className="whitespace-nowrap">
                  <span className="text-accent">{yesPercentOfTotal}%</span> /{" "}
                  <span className="text-destructive">{noPercentOfTotal}%</span>{" "}
                  / <span className="text-muted">{abstainPercentOfTotal}%</span>
                </span>
                <span className="text-xs font-semibold whitespace-nowrap text-muted">
                  {yesTotal} / {noTotal} / {abstainTotal}
                </span>
              </>
            }
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            labelClassName="whitespace-nowrap"
            valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
          />
          <StatTile
            label="Time left"
            value={proposal.timeLeft}
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            labelClassName="whitespace-nowrap"
            valueClassName="whitespace-nowrap text-2xl font-semibold"
          />
          <StatTile
            label="Passing (%)"
            value={
              <>
                <span className="whitespace-nowrap">
                  {yesPercentOfQuorum}% / {passingNeededPercent}%
                </span>
                <span className="text-xs font-semibold whitespace-nowrap text-muted">
                  Yes within quorum
                </span>
              </>
            }
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
          />
        </div>
      </section>

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

export default ProposalChamber;

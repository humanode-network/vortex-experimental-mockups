import { useParams } from "react-router";
import ProposalStageBar from "@/components/ProposalStageBar";
import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import { VoteButton } from "@/components/VoteButton";
import {
  ProposalInvisionInsightCard,
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
} from "@/components/ProposalSections";
import { getChamberProposalPage } from "@/data/mock/proposalPages";

const ProposalChamber: React.FC = () => {
  const { id } = useParams();
  const proposal = getChamberProposalPage(id);

  const yesTotal = proposal.votes.yes;
  const noTotal = proposal.votes.no;
  const abstainTotal = proposal.votes.abstain;
  const engaged = proposal.engagedGovernors;
  const quorumNeeded = Math.ceil(
    proposal.activeGovernors * proposal.attentionQuorum,
  );
  const quorumPercent = Math.round((engaged / proposal.activeGovernors) * 100);
  const yesPercentOfQuorum =
    engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;

  const [filledSlots, totalSlots] = proposal.teamSlots
    .split("/")
    .map((v) => Number(v.trim()));
  const openSlots = Math.max(totalSlots - filledSlots, 0);

  const renderStageBar = (
    current: "draft" | "pool" | "chamber" | "formation",
  ) => <ProposalStageBar current={current} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <Surface
        as="section"
        variant="panel"
        radius="2xl"
        shadow="card"
        className="p-6"
      >
        <div className="grid gap-4">
          <div className="space-y-4">
            <h1 className="text-center text-2xl font-semibold text-text">
              {proposal.title}
            </h1>
            {renderStageBar("chamber")}
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile
                label="Chamber"
                value={proposal.chamber}
                radius="2xl"
                className="px-4 py-4"
                labelClassName="text-[0.8rem]"
                valueClassName="text-2xl"
              />
              <StatTile
                label="Proposer"
                value={proposal.proposer}
                radius="2xl"
                className="px-4 py-4"
                labelClassName="text-[0.8rem]"
                valueClassName="text-2xl"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <VoteButton tone="accent" label="Vote yes" />
              <VoteButton tone="destructive" label="Vote no" />
              <VoteButton tone="neutral" label="Abstain" />
            </div>

            <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Governors"
                value={
                  <>
                    {engaged} / {quorumNeeded}
                  </>
                }
                variant="panel"
                className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
                valueClassName="whitespace-nowrap text-2xl font-semibold"
              />
              <StatTile
                label="Yes / No / Abstain"
                value={
                  <>
                    {yesTotal} / {noTotal} / {abstainTotal}
                  </>
                }
                variant="panel"
                className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
                labelClassName="whitespace-nowrap"
                valueClassName="whitespace-nowrap text-2xl font-semibold"
              />
              <StatTile
                label="Quorum (%)"
                value={quorumPercent}
                variant="panel"
                className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
                labelClassName="whitespace-nowrap"
                valueClassName="whitespace-nowrap text-2xl font-semibold"
              />
              <StatTile
                label="Passing"
                value={`${yesPercentOfQuorum}% yes`}
                variant="panel"
                className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
                valueClassName="whitespace-nowrap text-2xl font-semibold"
              />
            </div>
          </div>
        </div>
      </Surface>

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
    </div>
  );
};

export default ProposalChamber;

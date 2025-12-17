import { useState } from "react";
import { useParams } from "react-router";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import ProposalStageBar from "@/components/ProposalStageBar";
import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import { AttachmentList } from "@/components/AttachmentList";
import { TitledSurface } from "@/components/TitledSurface";
import { VoteButton } from "@/components/VoteButton";
import { Modal } from "@/components/Modal";
import { getPoolProposalPage } from "@/data/mock/proposalPages";

const ProposalPP: React.FC = () => {
  const { id } = useParams();
  const proposal = getPoolProposalPage(id);

  const [filledSlots, totalSlots] = proposal.teamSlots
    .split("/")
    .map((v) => Number(v.trim()));
  const openSlots = Math.max(totalSlots - filledSlots, 0);
  const [showRules, setShowRules] = useState(false);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "upvote" | "downvote" | null
  >(null);
  const { teamLocked, openSlotNeeds, milestonesDetail } = proposal;

  const engaged = proposal.upvotes + proposal.downvotes;
  const attentionNeeded = Math.ceil(
    proposal.activeGovernors * proposal.attentionQuorum,
  );
  const attentionPercent = Math.round(
    (engaged / proposal.activeGovernors) * 100,
  );
  const attentionNeededPercent = Math.round(proposal.attentionQuorum * 100);
  const upvoteFloorPercent = Math.round(
    (proposal.upvoteFloor / proposal.activeGovernors) * 100,
  );
  const upvoteCurrentPercent = Math.round(
    (proposal.upvotes / proposal.activeGovernors) * 100,
  );

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
        <div className="grid items-start gap-4">
          <div className="space-y-4">
            <h1 className="text-center text-2xl font-semibold text-text">
              {proposal.title}
            </h1>
            {renderStageBar("pool")}
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
            <div className="flex flex-wrap items-center justify-center gap-4">
              <VoteButton
                size="lg"
                tone="accent"
                icon="▲"
                label="Upvote"
                onClick={() => {
                  setPendingAction("upvote");
                  setRulesChecked(false);
                  setShowRules(true);
                }}
              />
              <VoteButton
                size="lg"
                tone="destructive"
                icon="▼"
                label="Downvote"
                onClick={() => {
                  setPendingAction("downvote");
                  setRulesChecked(false);
                  setShowRules(true);
                }}
              />
            </div>
            <div className="mx-auto flex w-fit items-center gap-5 rounded-full border border-border bg-panel-alt px-14 py-7 text-2xl font-semibold text-text">
              <span className="text-[var(--accent)]">
                {proposal.upvotes} upvotes
              </span>
              <span className="text-muted">·</span>
              <span className="text-[var(--destructive)]">
                {proposal.downvotes} downvotes
              </span>
            </div>
          </div>

          <Card className="h-full bg-panel-alt">
            <CardHeader className="pb-2">
              <CardTitle>Quorum of attention</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-2">
              <StatTile
                label="Governors"
                value={
                  <>
                    {engaged} / {attentionNeeded}
                  </>
                }
                variant="panel"
                className="flex min-h-[96px] flex-col items-center justify-center gap-1 py-4"
                valueClassName="text-2xl font-semibold whitespace-nowrap"
              />
              <StatTile
                label="Upvotes"
                value={
                  <>
                    {proposal.upvotes} / {proposal.upvoteFloor}
                  </>
                }
                variant="panel"
                className="flex min-h-[96px] flex-col items-center justify-center gap-1 py-4"
                valueClassName="text-2xl font-semibold whitespace-nowrap"
              />
              <StatTile
                label="Governors (%)"
                value={
                  <>
                    {attentionPercent} / {attentionNeededPercent}
                  </>
                }
                variant="panel"
                className="flex min-h-[96px] flex-col items-center justify-center gap-1 py-4"
                labelClassName="whitespace-nowrap"
                valueClassName="text-2xl font-semibold whitespace-nowrap"
              />
              <StatTile
                label="Upvotes (%)"
                value={
                  <>
                    {upvoteCurrentPercent} / {upvoteFloorPercent}
                  </>
                }
                variant="panel"
                className="flex min-h-[96px] flex-col items-center justify-center gap-1 py-4"
                labelClassName="whitespace-nowrap"
                valueClassName="text-2xl font-semibold whitespace-nowrap"
              />
            </CardContent>
          </Card>
        </div>
      </Surface>

      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>
            Introduce redundant biometric sequencers to reduce failover time and
            enable double commits across epochs. Pool stage is collecting quorum
            of attention before moving to a chamber vote.
          </p>
          <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
            {[
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
                value: `${proposal.milestones} planned · pilot + rollout`,
              },
            ].map((item) => (
              <StatTile
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
          <div className="space-y-4 text-text">
            <TitledSurface title="Proposal overview">
              <p className="text-sm leading-relaxed text-muted">
                Redundant sequencers across clusters with cross-epoch
                checkpointing to keep biometric validation live during
                failovers. Includes telemetry surfacing, alerting hooks, and
                rollback gates tied to liveness SLOs. Targets neutral failover
                without privileging any validator set.
              </p>
            </TitledSurface>
            <TitledSurface title="Execution plan">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                <li>
                  Pilot (2 weeks): 2 clusters, shadow checkpoints, watch
                  liveness/latency.
                </li>
                <li>
                  Rollout (next 4 weeks): stage to remaining clusters with
                  checkpoint cadence.
                </li>
                <li>
                  Observability: dashboards, alerts on failover duration, revert
                  on &gt;1% liveness regression for 2 epochs.
                </li>
                <li>
                  Post-rollout: document runbooks and handoff to chamber ops.
                </li>
              </ul>
            </TitledSurface>
            <TitledSurface title="Budget & scope">
              <p className="text-sm text-muted">
                210k HMND covering hardware, telemetry integration, and rollout
                validation. Team: {proposal.teamSlots} with milestone target of{" "}
                {proposal.milestones}; includes QA, ops, and telemetry owners.
              </p>
            </TitledSurface>
            <div className="grid gap-3 lg:grid-cols-2">
              <TitledSurface title="Team (locked)">
                <ul className="space-y-2 text-sm text-muted">
                  {teamLocked.map((member) => (
                    <Surface
                      key={member.name}
                      as="li"
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <span className="font-semibold text-text">
                        {member.name}
                      </span>
                      <span className="text-xs text-muted">{member.role}</span>
                    </Surface>
                  ))}
                </ul>
              </TitledSurface>
              <TitledSurface title="Open slots (positions)">
                <ul className="space-y-2 text-sm text-muted">
                  {openSlotNeeds.map((slot) => (
                    <Surface
                      key={slot.title}
                      as="li"
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-3 py-2"
                    >
                      <p className="font-semibold text-text">{slot.title}</p>
                      <p className="text-xs text-muted">{slot.desc}</p>
                    </Surface>
                  ))}
                </ul>
              </TitledSurface>
            </div>
            <TitledSurface title="Milestones">
              <ul className="space-y-2 text-sm text-muted">
                {milestonesDetail.map((ms) => (
                  <Surface
                    key={ms.title}
                    as="li"
                    variant="panel"
                    radius="xl"
                    shadow="control"
                    className="px-3 py-2"
                  >
                    <p className="font-semibold text-text">{ms.title}</p>
                    <p className="text-xs text-muted">{ms.desc}</p>
                  </Surface>
                ))}
              </ul>
            </TitledSurface>
            <AttachmentList items={proposal.attachments} />
          </div>
        </CardContent>
      </Card>

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
              className="h-4 w-4 accent-[var(--primary)]"
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
              disabled={!rulesChecked}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                !rulesChecked
                  ? "cursor-not-allowed bg-muted text-[var(--primary-foreground)] opacity-60"
                  : pendingAction === "downvote"
                    ? "border-2 border-[var(--destructive)] bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-95"
                    : "border-2 border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-95"
              }`}
              onClick={() => setShowRules(false)}
            >
              {pendingAction === "downvote"
                ? "Confirm downvote"
                : "Confirm upvote"}
            </button>
          </div>
        </Surface>
      </Modal>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Invision insight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-text">
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>
              Addresses liveness bottlenecks by adding redundant biometric
              sequencers and cross-epoch checkpoints.
            </li>
            <li>
              Focuses on validator neutrality: rollout reduces single-operator
              dependence in failover events.
            </li>
            <li>alongside hardware budget.</li>
            <li>
              Risk note: requires chamber coordination for staged deployment and
              rollback on adverse metrics.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalPP;

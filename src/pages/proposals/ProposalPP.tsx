import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProposalStageBar from "@/components/ProposalStageBar";
import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { AppPage } from "@/components/AppPage";

const ProposalPP: React.FC = () => {
  const proposal = {
    title: "Sequencer redundancy rollout",
    proposer: "John Doe",
    proposerId: "john-doe",
    chamber: "Protocol chamber",
    focus: "Liveness & validators",
    tier: "Legate",
    budget: "210k HMND",
    cooldown: "Withdraw cooldown: 12h",
    formationEligible: true,
    teamSlots: "3 / 6",
    milestones: "2",
    upvotes: 18,
    downvotes: 4,
    attentionQuorum: 0.22,
    activeGovernors: 100,
    upvoteFloor: 10,
  };

  const [filledSlots, totalSlots] = proposal.teamSlots
    .split("/")
    .map((v) => Number(v.trim()));
  const openSlots = Math.max(totalSlots - filledSlots, 0);
  const [showRules, setShowRules] = useState(false);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "upvote" | "downvote" | null
  >(null);
  const teamLocked = [
    { name: "John Doe", role: "Lead · Protocol" },
    { name: "Raamara", role: "Ops & rollout" },
    { name: "Nyx", role: "Telemetry" },
  ];
  const openSlotNeeds = [
    {
      title: "SRE / Reliability",
      desc: "Own failover playbooks and alert tuning during rollout.",
    },
    {
      title: "QA engineer",
      desc: "Validate checkpoints and regression-test liveness across clusters.",
    },
    {
      title: "Tech writer",
      desc: "Document runbooks and operator guides post-rollout.",
    },
  ];
  const milestonesDetail = [
    {
      title: "Pilot deploy",
      desc: "Shadow checkpoints on 2 clusters; collect liveness/latency baselines.",
    },
    {
      title: "Global rollout",
      desc: "Stage to remaining clusters with rollback gates on regressions.",
    },
    {
      title: "Handoff & docs",
      desc: "Finalize dashboards, runbooks, and training for chamber ops.",
    },
  ];

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
    <AppPage pageId="proposals">
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
              <button
                type="button"
                className="flex min-w-[220px] items-center justify-center gap-3 rounded-full border-2 border-[var(--accent)] px-12 py-6 text-2xl leading-none font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                onClick={() => {
                  setPendingAction("upvote");
                  setRulesChecked(false);
                  setShowRules(true);
                }}
              >
                <span className="text-2xl leading-none">▲</span>
                <span className="text-2xl leading-none">Upvote</span>
              </button>
              <button
                type="button"
                className="flex min-w-[220px] items-center justify-center gap-3 rounded-full border-2 border-[var(--destructive)] px-12 py-6 text-2xl leading-none font-semibold text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
                onClick={() => {
                  setPendingAction("downvote");
                  setRulesChecked(false);
                  setShowRules(true);
                }}
              >
                <span className="text-2xl leading-none">▼</span>
                <span className="text-2xl leading-none">Downvote</span>
              </button>
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
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Proposal overview</p>
              <p className="text-sm leading-relaxed text-muted">
                Redundant sequencers across clusters with cross-epoch
                checkpointing to keep biometric validation live during
                failovers. Includes telemetry surfacing, alerting hooks, and
                rollback gates tied to liveness SLOs. Targets neutral failover
                without privileging any validator set.
              </p>
            </Surface>
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Execution plan</p>
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
            </Surface>
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Budget & scope</p>
              <p className="text-sm text-muted">
                210k HMND covering hardware, telemetry integration, and rollout
                validation. Team: {proposal.teamSlots} with milestone target of{" "}
                {proposal.milestones}; includes QA, ops, and telemetry owners.
              </p>
            </Surface>
            <div className="grid gap-3 lg:grid-cols-2">
              <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
                <p className="text-sm font-semibold">Team (locked)</p>
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
              </Surface>
              <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
                <p className="text-sm font-semibold">Open slots (positions)</p>
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
              </Surface>
            </div>
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Milestones</p>
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
            </Surface>
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Attachments</p>
              <ul className="space-y-2 text-sm text-muted">
                <Surface
                  as="li"
                  variant="panel"
                  radius="xl"
                  shadow="control"
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span>Rollout plan (PDF)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </Surface>
                <Surface
                  as="li"
                  variant="panel"
                  radius="xl"
                  shadow="control"
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span>Telemetry checklist (DOC)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </Surface>
                <Surface
                  as="li"
                  variant="panel"
                  radius="xl"
                  shadow="control"
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span>Budget breakdown (XLS)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </Surface>
              </ul>
            </Surface>
          </div>
        </CardContent>
      </Card>

      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--veil)] p-4 backdrop-blur-sm">
          <Surface
            variant="panel"
            radius="2xl"
            shadow="popover"
            className="w-full max-w-xl p-6 text-text"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">Pool rules</p>
              <button
                className="text-sm text-muted hover:text-text"
                onClick={() => setShowRules(false)}
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-sm text-muted">
              <ul className="list-disc space-y-1 pl-4">
                <li>22% attention from active governors required.</li>
                <li>At least 10% upvotes to move to chamber.</li>
                <li>Delegated votes are ignored in the pool.</li>
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
        </div>
      )}

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
    </AppPage>
  );
};

export default ProposalPP;

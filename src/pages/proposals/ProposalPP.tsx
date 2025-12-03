import { useParams } from "react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProposalPP: React.FC = () => {
  const { id } = useParams();
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
  ) => {
    const stages = [
      { key: "draft", label: "Draft", color: "bg-slate-300 text-slate-800" },
      { key: "pool", label: "Proposal pool", color: "bg-blue-500 text-white" },
      {
        key: "chamber",
        label: "Chamber vote",
        color: "bg-emerald-500 text-white",
      },
      {
        key: "formation",
        label: "Formation",
        color: "bg-orange-500 text-white",
      },
    ] as const;
    return (
      <div className="flex gap-2">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold ${
              current === stage.key ? stage.color : "bg-slate-200 text-muted"
            }`}
          >
            {stage.label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app-page flex flex-col gap-6">
      <section className="bg-panel rounded-2xl border border-border p-6">
        <div className="grid items-start gap-4">
          <div className="space-y-4">
            <h1 className="text-center text-2xl font-semibold text-(--text)">
              {proposal.title}
            </h1>
            {renderStageBar("pool")}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center">
                <p className="text-[0.8rem] tracking-wide text-muted uppercase">
                  Chamber
                </p>
                <p className="text-2xl font-semibold">{proposal.chamber}</p>
              </div>
              <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center">
                <p className="text-[0.8rem] tracking-wide text-muted uppercase">
                  Proposer
                </p>
                <p className="text-2xl font-semibold">{proposal.proposer}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                className="flex min-w-[220px] items-center justify-center gap-3 rounded-full border-2 border-emerald-500 px-12 py-6 text-2xl leading-none font-semibold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white"
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
                className="flex min-w-[220px] items-center justify-center gap-3 rounded-full border-2 border-red-500 px-12 py-6 text-2xl leading-none font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white"
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
            <div className="bg-panel-alt mx-auto flex w-fit items-center gap-5 rounded-full border border-border px-14 py-7 text-2xl font-semibold text-(--text)">
              <span className="text-emerald-600">
                {proposal.upvotes} upvotes
              </span>
              <span className="text-muted">·</span>
              <span className="text-red-600">
                {proposal.downvotes} downvotes
              </span>
            </div>
          </div>

          <Card className="bg-panel-alt h-full border border-border">
            <CardHeader className="pb-2">
              <CardTitle>Quorum of attention</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-(--text) sm:grid-cols-2 lg:grid-cols-2">
              <div className="bg-panel flex h-full min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Governors
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {engaged} / {attentionNeeded}
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Upvotes
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {proposal.upvotes} / {proposal.upvoteFloor}
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide whitespace-nowrap text-muted uppercase">
                  Governors (%)
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {attentionPercent} / {attentionNeededPercent}
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-[96px] flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide whitespace-nowrap text-muted uppercase">
                  Upvotes (%)
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {upvoteCurrentPercent} / {upvoteFloorPercent}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

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
          <div className="grid gap-3 text-sm text-(--text) sm:grid-cols-2 lg:grid-cols-4">
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
              <div
                key={item.label}
                className="bg-panel-alt rounded-xl border border-border px-3 py-3 text-center"
              >
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  {item.label}
                </p>
                <p className="text-base font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4 text-(--text)">
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Proposal overview</p>
              <p className="text-sm leading-relaxed text-muted">
                Redundant sequencers across clusters with cross-epoch
                checkpointing to keep biometric validation live during
                failovers. Includes telemetry surfacing, alerting hooks, and
                rollback gates tied to liveness SLOs. Targets neutral failover
                without privileging any validator set.
              </p>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
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
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Budget & scope</p>
              <p className="text-sm text-muted">
                210k HMND covering hardware, telemetry integration, and rollout
                validation. Team: {proposal.teamSlots} with milestone target of{" "}
                {proposal.milestones}; includes QA, ops, and telemetry owners.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
                <p className="text-sm font-semibold">Team (locked)</p>
                <ul className="space-y-2 text-sm text-muted">
                  {teamLocked.map((member) => (
                    <li
                      key={member.name}
                      className="bg-panel flex items-center justify-between rounded-xl border border-border px-3 py-2"
                    >
                      <span className="font-semibold text-(--text)">
                        {member.name}
                      </span>
                      <span className="text-xs text-muted">{member.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
                <p className="text-sm font-semibold">Open slots (positions)</p>
                <ul className="space-y-2 text-sm text-muted">
                  {openSlotNeeds.map((slot) => (
                    <li
                      key={slot.title}
                      className="bg-panel rounded-xl border border-border px-3 py-2"
                    >
                      <p className="font-semibold text-(--text)">
                        {slot.title}
                      </p>
                      <p className="text-xs text-muted">{slot.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Milestones</p>
              <ul className="space-y-2 text-sm text-muted">
                {milestonesDetail.map((ms) => (
                  <li
                    key={ms.title}
                    className="bg-panel rounded-xl border border-border px-3 py-2"
                  >
                    <p className="font-semibold text-(--text)">{ms.title}</p>
                    <p className="text-xs text-muted">{ms.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Attachments</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="bg-panel flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <span>Rollout plan (PDF)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </li>
                <li className="bg-panel flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <span>Telemetry checklist (DOC)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </li>
                <li className="bg-panel flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <span>Budget breakdown (XLS)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-panel/95 w-full max-w-xl rounded-2xl border border-border p-6 text-white shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">Pool rules</p>
              <button
                className="text-sm text-gray-300 hover:text-white"
                onClick={() => setShowRules(false)}
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-200">
              <ul className="list-disc space-y-1 pl-4">
                <li>22% attention from active governors required.</li>
                <li>At least 10% upvotes to move to chamber.</li>
                <li>Delegated votes are ignored in the pool.</li>
              </ul>
            </div>
            <div className="bg-panel-alt mt-4 flex items-center gap-2 rounded-xl border border-border px-3 py-2">
              <input
                id="rules-confirm"
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={rulesChecked}
                onChange={(e) => setRulesChecked(e.target.checked)}
              />
              <label htmlFor="rules-confirm" className="text-sm text-white">
                I read the proposal and know the rules
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="hover:bg-panel-alt/50 rounded-full border border-border px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setShowRules(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rulesChecked}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  !rulesChecked
                    ? "cursor-not-allowed bg-muted text-white opacity-60"
                    : pendingAction === "downvote"
                      ? "border-2 border-red-500 text-white hover:bg-red-600"
                      : "border-2 border-emerald-500 text-white hover:bg-emerald-500"
                }`}
                onClick={() => setShowRules(false)}
              >
                {pendingAction === "downvote"
                  ? "Confirm downvote"
                  : "Confirm upvote"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Invision insight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-(--text)">
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>
              Addresses liveness bottlenecks by adding redundant biometric
              sequencers and cross-epoch checkpoints.
            </li>
            <li>
              Focuses on validator neutrality: rollout reduces single-operator
              dependence in failover events.
            </li>
            <li>
              Formation impact: new telemetry and health-kit playbooks needed
              alongside hardware budget.
            </li>
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

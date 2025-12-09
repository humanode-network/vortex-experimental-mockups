import { useParams } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HintLabel } from "@/components/Hint";

const ProposalFormation: React.FC = () => {
  useParams();
  const project = {
    title: "Deterrence Sim Lab",
    chamber: "Research",
    proposer: "Research Lab",
    proposerId: "john-doe",
    budget: "180k HMND",
    impact: "High",
    timeLeft: "12d",
    teamSlots: "3 / 6",
    milestones: "2 / 3",
    progress: "68%",
    stageData: [
      { title: "Budget allocated", description: "HMND", value: "180k" },
      { title: "Team slots", description: "Taken / Total", value: "3 / 6" },
      {
        title: "Deployment progress",
        description: "Reported completion",
        value: "68%",
      },
    ],
    stats: [
      { label: "Lead chamber", value: "Research" },
      { label: "Next check-in", value: "Epoch 186" },
    ],
    lockedTeam: [
      { name: "John Doe", role: "Lead · Research" },
      { name: "Nyx", role: "Telemetry & Ops" },
      { name: "Raamara", role: "QA" },
    ],
    openSlots: [
      {
        title: "SRE / Reliability",
        desc: "Own rollout stability and failover drills.",
      },
      {
        title: "QA engineer",
        desc: "Validate milestones and regression suite.",
      },
      {
        title: "Tech writer",
        desc: "Document runbooks and Formation reports.",
      },
    ],
    milestonesDetail: [
      {
        title: "Pilot deploy",
        desc: "Shadow checkpoints on 2 clusters; collect liveness baselines.",
      },
      {
        title: "Global rollout",
        desc: "Stage to remaining clusters with rollback gates on regressions.",
      },
      {
        title: "Handoff & docs",
        desc: "Finalize dashboards, runbooks, and training for chamber ops.",
      },
    ],
  };

  const renderStageBar = (
    current: "draft" | "pool" | "chamber" | "formation",
  ) => {
    const stages = [
      { key: "draft", label: "Draft", color: "bg-slate-300 text-slate-800" },
      {
        key: "pool",
        label: "Proposal pool",
        color: "bg-blue-500 text-white",
        render: <HintLabel termId="proposal_pools">Proposal pool</HintLabel>,
      },
      {
        key: "chamber",
        label: "Chamber vote",
        color: "bg-emerald-500 text-white",
        render: <HintLabel termId="chamber_vote">Chamber vote</HintLabel>,
      },
      {
        key: "formation",
        label: "Formation",
        color: "bg-orange-500 text-white",
        render: <HintLabel termId="formation">Formation</HintLabel>,
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
            {"render" in stage && stage.render ? stage.render : stage.label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app-page flex flex-col gap-6">
      <section className="bg-panel rounded-2xl border border-border p-6">
        <div className="grid gap-4">
          <div className="space-y-4">
            <h1 className="text-center text-2xl font-semibold text-(--text)">
              {project.title}
            </h1>
            {renderStageBar("formation")}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center">
                <p className="text-[0.8rem] tracking-wide text-muted uppercase">
                  Chamber
                </p>
                <p className="text-2xl font-semibold">{project.chamber}</p>
              </div>
              <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center">
                <p className="text-[0.8rem] tracking-wide text-muted uppercase">
                  Proposer
                </p>
                <p className="text-2xl font-semibold">{project.proposer}</p>
              </div>
            </div>
          </div>

          <Card className="bg-panel-alt h-full border border-border">
            <CardHeader className="pb-2">
              <CardTitle>Project status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-(--text) sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-panel flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Budget allocated
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {project.budget}
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Team slots
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {project.teamSlots}
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Milestones
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {project.milestones}
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Progress
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {project.progress}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>
            Simulation track for deterrence scenarios; focuses on reliability
            under adversarial conditions. Formation build with staged milestones
            and open roles.
          </p>
          <div className="grid gap-2 text-sm text-(--text) sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Budget ask", value: project.budget },
              { label: "Impact", value: project.impact },
              { label: "Time left", value: project.timeLeft },
              { label: "Milestones", value: project.milestones },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-panel-alt rounded-xl border border-border px-3 py-2 text-center"
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
              <p className="text-sm font-semibold">Project overview</p>
              <p className="text-sm leading-relaxed text-muted">
                Simulation and tooling for deterrence drills; centers on
                redundancy and rollback gates. Ties into Research chamber
                oversight and Formation delivery.
              </p>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Execution plan</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                <li>
                  Pilot milestones on two clusters; capture baselines and
                  regressions.
                </li>
                <li>
                  Roll out to remaining clusters with staged checkpoints and
                  rollback triggers.
                </li>
                <li>
                  Document and hand off runbooks to chamber ops and Formation
                  PM.
                </li>
              </ul>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Budget & scope</p>
              <p className="text-sm text-muted">
                180k HMND covering simulation infra, telemetry, and
                documentation. Includes QA, ops, and writer roles.
              </p>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Attachments</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="bg-panel flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <span>Simulation playbook (PDF)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </li>
                <li className="bg-panel flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <span>Milestone breakdown (XLS)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-panel overflow-hidden border border-border">
        <CardContent className="space-y-3 pt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {project.stageData.map((entry) => (
              <div
                key={entry.title}
                className="bg-panel-alt rounded-xl border border-border p-4"
              >
                <p className="text-sm font-semibold text-muted">
                  {entry.title}
                </p>
                <p className="text-xs text-muted">{entry.description}</p>
                <p className="text-lg font-semibold text-(--text)">
                  {entry.value}
                </p>
              </div>
            ))}
          </div>

          <ul className="grid gap-2 text-sm text-(--text) md:grid-cols-2">
            {project.stats.map((stat) => (
              <li
                key={stat.label}
                className="bg-panel-alt rounded-xl border border-dashed border-border/70 px-4 py-3"
              >
                <span className="font-semibold">{stat.label}:</span>{" "}
                {stat.value}
              </li>
            ))}
          </ul>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Team (locked)</p>
              <ul className="space-y-2 text-sm text-muted">
                {project.lockedTeam.map((member) => (
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
              <p className="text-sm font-semibold">Open slots</p>
              <ul className="space-y-2 text-sm text-muted">
                {project.openSlots.map((slot) => (
                  <li
                    key={slot.title}
                    className="bg-panel rounded-xl border border-border px-3 py-2"
                  >
                    <p className="font-semibold text-(--text)">{slot.title}</p>
                    <p className="text-xs text-muted">{slot.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
            <p className="text-sm font-semibold">Milestones</p>
            <ul className="space-y-2 text-sm text-muted">
              {project.milestonesDetail.map((ms) => (
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={`/human-nodes/${project.proposerId}`}
              className="text-sm font-semibold text-primary"
            >
              Proposer: {project.proposer}
            </Link>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/formation">Open project</Link>
              </Button>
              <Button size="sm" variant="ghost">
                Ping team
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalFormation;

import { useParams } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HintLabel } from "@/components/Hint";
import { HintLabel } from "@/components/Hint";

const ProposalChamber: React.FC = () => {
  const { id } = useParams();
  const proposal = {
    title: "Adaptive Fee Shaping",
    proposer: "Victor",
    proposerId: "Victor",
    chamber: "Economics & Treasury",
    budget: "210k HMND",
    impact: "Medium",
    timeLeft: "05h 15m",
    votes: { yes: 34, no: 18, abstain: 3 },
    attentionQuorum: 0.33,
    passingRule: "≥66.6% + 1 yes within quorum",
    engagedGovernors: 55,
    activeGovernors: 100,
  };

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
              {proposal.title}
            </h1>
            {renderStageBar("chamber")}
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
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button className="min-w-[140px] rounded-full border-2 border-emerald-500 px-6 py-2 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white">
                Vote yes
              </button>
              <button className="min-w-[140px] rounded-full border-2 border-red-500 px-6 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white">
                Vote no
              </button>
              <button className="min-w-[140px] rounded-full border-2 border-slate-500 px-6 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-500 hover:text-white">
                Abstain
              </button>
            </div>
          </div>

          <Card className="bg-panel-alt h-full border border-border">
            <CardHeader className="pb-2">
              <CardTitle>Voting quorum</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-(--text) sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-panel flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Governors
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {engaged} / {quorumNeeded}
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Yes / No / Abstain
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {yesTotal} / {noTotal} / {abstainTotal}
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Quorum (%)
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {quorumPercent}%
                </p>
              </div>
              <div className="bg-panel flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Passing
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {yesPercentOfQuorum}% yes
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
            Dynamic fee split that feeds Formation, treasury, and biometric
            maintenance based on network stress and quorum activity.
          </p>
          <div className="grid gap-2 text-sm text-(--text) sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Budget ask", value: proposal.budget },
              { label: "Impact", value: proposal.impact },
              { label: "Time left", value: proposal.timeLeft },
              { label: "Passing rule", value: proposal.passingRule },
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
              <p className="text-sm font-semibold">Proposal overview</p>
              <p className="text-sm leading-relaxed text-muted">
                Adjusts fee splits dynamically to balance treasury, Formation,
                and biometric maintenance. Aims to align incentives with network
                stress signals.
              </p>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Execution plan</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                <li>
                  Pilot dynamic split on low-traffic hours; observe treasury
                  inflow variance.
                </li>
                <li>
                  Rollout to all chambers with 24h monitoring; revert if
                  treasury drawdown exceeds target.
                </li>
                <li>
                  Publish dashboards for fee split telemetry and alert
                  thresholds.
                </li>
              </ul>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Budget & scope</p>
              <p className="text-sm text-muted">
                210k HMND covering telemetry work, contract changes, and
                validation. Focused on Economics chamber with cross-chamber
                reporting.
              </p>
            </div>
            <div className="bg-panel-alt space-y-2 rounded-2xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">Attachments</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="bg-panel flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <span>Fee split design (PDF)</span>
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
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-panel overflow-hidden border border-border">
        <CardContent className="space-y-3 pt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Voting quorum",
                description: "Strict 33% active governors",
                value: "Met · 34%",
                tone: "ok",
              },
              {
                title: "Passing rule",
                description: "≥66.6% + 1 yes",
                value: "Current 57%",
                tone: "warn",
              },
              {
                title: "Time left",
                description: "Voting window",
                value: proposal.timeLeft,
              },
            ].map((entry) => (
              <div
                key={entry.title}
                className="bg-panel-alt rounded-xl border border-border p-4"
              >
                <p className="text-sm font-semibold text-muted">
                  {entry.title}
                </p>
                <p className="text-xs text-muted">{entry.description}</p>
                <p
                  className={cn(
                    "text-lg font-semibold text-(--text)",
                    entry.tone === "ok" && "text-emerald-500",
                    entry.tone === "warn" && "text-amber-500",
                  )}
                >
                  {entry.value}
                </p>
              </div>
            ))}
          </div>

          <ul className="grid gap-2 text-sm text-(--text) md:grid-cols-2">
            {[
              {
                label: "Proof mix",
                value: (
                  <>
                    <HintLabel termId="proof_of_time_pot">PoT</HintLabel> 30% ·{" "}
                    <HintLabel termId="proof_of_devotion_pod">PoD</HintLabel>{" "}
                    50% ·{" "}
                    <HintLabel termId="proof_of_governance_pog">PoG</HintLabel>{" "}
                    20%
                  </>
                ),
              },
              { label: "Formation impact", value: proposal.impact },
              { label: "Votes casted", value: "34" },
              {
                label: "Tier requirement",
                value: <HintLabel termId="tier4_consul">Consul</HintLabel>,
              },
            ].map((stat) => (
              <li
                key={stat.label}
                className="bg-panel-alt rounded-xl border border-dashed border-border/70 px-4 py-3"
              >
                <span className="font-semibold">{stat.label}:</span>{" "}
                {stat.value}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={`/human-nodes/${proposal.proposerId}`}
              className="text-sm font-semibold text-primary"
            >
              Proposer: {proposal.proposer}
            </Link>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to={`/proposals/${id ?? "adaptive-fee-shaping"}/chamber`}>
                  Open proposal
                </Link>
              </Button>
              <Button size="sm" variant="ghost">
                Track vote
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalChamber;

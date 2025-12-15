import { useParams } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HintLabel } from "@/components/Hint";
import ProposalStageBar from "@/components/ProposalStageBar";

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
  ) => <ProposalStageBar current={current} />;

  return (
    <div className="app-page flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-panel p-6">
        <div className="grid gap-4">
          <div className="space-y-4">
            <h1 className="text-center text-2xl font-semibold text-(--text)">
              {proposal.title}
            </h1>
            {renderStageBar("chamber")}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel-alt px-4 py-4 text-center">
                <p className="text-[0.8rem] tracking-wide text-muted uppercase">
                  Chamber
                </p>
                <p className="text-2xl font-semibold">{proposal.chamber}</p>
              </div>
              <div className="rounded-2xl border border-border bg-panel-alt px-4 py-4 text-center">
                <p className="text-[0.8rem] tracking-wide text-muted uppercase">
                  Proposer
                </p>
                <p className="text-2xl font-semibold">{proposal.proposer}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button className="min-w-[140px] rounded-full border-2 border-[var(--accent)] px-6 py-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
                Vote yes
              </button>
              <button className="min-w-[140px] rounded-full border-2 border-[var(--destructive)] px-6 py-2 text-sm font-semibold text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]">
                Vote no
              </button>
              <button className="min-w-[140px] rounded-full border-2 border-border px-6 py-2 text-sm font-semibold text-muted transition-colors hover:bg-panel hover:text-text">
                Abstain
              </button>
            </div>
          </div>

          <Card className="h-full border border-border bg-panel-alt">
            <CardHeader className="pb-2">
              <CardTitle>Voting quorum</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-(--text) sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Governors
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {engaged} / {quorumNeeded}
                </p>
              </div>
              <div className="flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Yes / No / Abstain
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {yesTotal} / {noTotal} / {abstainTotal}
                </p>
              </div>
              <div className="flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel px-3 py-4 text-center">
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  Quorum (%)
                </p>
                <p className="text-2xl font-semibold whitespace-nowrap">
                  {quorumPercent}%
                </p>
              </div>
              <div className="flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-panel px-3 py-4 text-center">
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
                className="rounded-xl border border-border bg-panel-alt px-3 py-2 text-center"
              >
                <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                  {item.label}
                </p>
                <p className="text-base font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4 text-(--text)">
            <div className="space-y-2 rounded-2xl border border-border bg-panel-alt px-4 py-3">
              <p className="text-sm font-semibold">Proposal overview</p>
              <p className="text-sm leading-relaxed text-muted">
                Adjusts fee splits dynamically to balance treasury, Formation,
                and biometric maintenance. Aims to align incentives with network
                stress signals.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-border bg-panel-alt px-4 py-3">
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
            <div className="space-y-2 rounded-2xl border border-border bg-panel-alt px-4 py-3">
              <p className="text-sm font-semibold">Budget & scope</p>
              <p className="text-sm text-muted">
                210k HMND covering telemetry work, contract changes, and
                validation. Focused on Economics chamber with cross-chamber
                reporting.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-border bg-panel-alt px-4 py-3">
              <p className="text-sm font-semibold">Attachments</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-center justify-between rounded-xl border border-border bg-panel px-3 py-2">
                  <span>Fee split design (PDF)</span>
                  <button className="text-sm font-semibold text-primary">
                    View
                  </button>
                </li>
                <li className="flex items-center justify-between rounded-xl border border-border bg-panel px-3 py-2">
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

      <Card className="overflow-hidden border border-border bg-panel">
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
                className="rounded-xl border border-border bg-panel-alt p-4"
              >
                <p className="text-sm font-semibold text-muted">
                  {entry.title}
                </p>
                <p className="text-xs text-muted">{entry.description}</p>
                <p
                  className={cn(
                    "text-lg font-semibold text-(--text)",
                    entry.tone === "ok" && "text-[var(--accent)]",
                    entry.tone === "warn" && "text-[var(--accent-warm)]",
                  )}
                >
                  {entry.value}
                </p>
              </div>
            ))}
          </div>

          <ul className="grid gap-2 text-sm text-(--text) md:grid-cols-2">
            {[
              { label: "Votes casted", value: "34" },
              {
                label: "Tier requirement",
                value: <HintLabel termId="tier4_consul">Consul</HintLabel>,
              },
            ].map((stat) => (
              <li
                key={stat.label}
                className="rounded-xl border border-dashed border-border/70 bg-panel-alt px-4 py-3"
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

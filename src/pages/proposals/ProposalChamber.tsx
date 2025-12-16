import { useParams } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HintLabel } from "@/components/Hint";
import ProposalStageBar from "@/components/ProposalStageBar";
import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { AppPage } from "@/components/AppPage";

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
    <AppPage pageId="proposals">
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

          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Voting quorum</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Governors"
                value={
                  <>
                    {engaged} / {quorumNeeded}
                  </>
                }
                variant="panel"
                className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
                valueClassName="text-2xl font-semibold whitespace-nowrap"
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
                valueClassName="text-2xl font-semibold whitespace-nowrap"
              />
              <StatTile
                label="Quorum (%)"
                value={quorumPercent}
                variant="panel"
                className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
                labelClassName="whitespace-nowrap"
                valueClassName="text-2xl font-semibold whitespace-nowrap"
              />
              <StatTile
                label="Passing"
                value={`${yesPercentOfQuorum}% yes`}
                variant="panel"
                className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
                valueClassName="text-2xl font-semibold whitespace-nowrap"
              />
            </CardContent>
          </Card>
        </div>
      </Surface>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>
            Dynamic fee split that feeds Formation, treasury, and biometric
            maintenance based on network stress and quorum activity.
          </p>
          <div className="grid gap-2 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Budget ask", value: proposal.budget },
              { label: "Impact", value: proposal.impact },
              { label: "Time left", value: proposal.timeLeft },
              { label: "Passing rule", value: proposal.passingRule },
            ].map((item) => (
              <StatTile
                key={item.label}
                label={item.label}
                value={item.value}
                className="px-3 py-2"
              />
            ))}
          </div>
          <div className="space-y-4 text-text">
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Proposal overview</p>
              <p className="text-sm leading-relaxed text-muted">
                Adjusts fee splits dynamically to balance treasury, Formation,
                and biometric maintenance. Aims to align incentives with network
                stress signals.
              </p>
            </Surface>
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
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
            </Surface>
            <Surface variant="panelAlt" className="space-y-2 px-4 py-3">
              <p className="text-sm font-semibold">Budget & scope</p>
              <p className="text-sm text-muted">
                210k HMND covering telemetry work, contract changes, and
                validation. Focused on Economics chamber with cross-chamber
                reporting.
              </p>
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
                  <span>Fee split design (PDF)</span>
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
              </ul>
            </Surface>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
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
              <Surface
                key={entry.title}
                variant="panelAlt"
                radius="xl"
                shadow="tile"
                className="p-4"
              >
                <p className="text-sm font-semibold text-muted">
                  {entry.title}
                </p>
                <p className="text-xs text-muted">{entry.description}</p>
                <p
                  className={cn(
                    "text-lg font-semibold text-text",
                    entry.tone === "ok" && "text-[var(--accent)]",
                    entry.tone === "warn" && "text-[var(--accent-warm)]",
                  )}
                >
                  {entry.value}
                </p>
              </Surface>
            ))}
          </div>

          <ul className="grid gap-2 text-sm text-text md:grid-cols-2">
            {[
              { label: "Votes casted", value: "34" },
              {
                label: "Tier requirement",
                value: <HintLabel termId="tier4_consul">Consul</HintLabel>,
              },
            ].map((stat) => (
              <Surface
                key={stat.label}
                as="li"
                variant="panelAlt"
                radius="xl"
                borderStyle="dashed"
                className="px-4 py-3"
              >
                <span className="font-semibold">{stat.label}:</span>{" "}
                {stat.value}
              </Surface>
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
    </AppPage>
  );
};

export default ProposalChamber;

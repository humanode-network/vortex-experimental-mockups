import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const governanceState = {
  label: "Egalitarian Republic",
  subtitle: "Balanced council with rotating chancellors",
  summary:
    "The Vortex network operates as an egalitarian republic. Power is split between chambers, Formation squads, and elected councils. " +
    "Legitimacy is stable, and factions are cooperating on expansion and treasury projects.",
  metrics: [
    { label: "Legitimacy", value: "78%", trend: "+3% vs last epoch" },
    { label: "Stability", value: "72%", trend: "Neutral" },
    { label: "Centralization", value: "44%", trend: "Decentralizing" },
  ],
};

const factions = [
  {
    name: "Civic Union",
    members: "38 members",
    stance: "Pro-expansion, social reform",
  },
  {
    name: "Protocol Guard",
    members: "31 members",
    stance: "Security-first, validator hawks",
  },
  {
    name: "Arcadian Treasury",
    members: "24 members",
    stance: "Fiscal conservatives",
  },
  {
    name: "Formation League",
    members: "17 members",
    stance: "Growth of squads & guilds",
  },
];

const economicIndicators = [
  {
    label: "Treasury reserves",
    value: "412M HMND",
    detail: "52 weeks of runway",
  },
  { label: "Burn rate", value: "7.8M HMND / epoch", detail: "Up 4% vs prior" },
  {
    label: "Civic budget",
    value: "112M HMND",
    detail: "Infrastructure & grants",
  },
  {
    label: "Trade routes",
    value: "9 active",
    detail: "Formation & faction deals",
  },
];

const riskSignals = [
  {
    title: "Faction cohesion",
    status: "Low risk",
    detail: "Blocs aligned on governance reforms",
  },
  {
    title: "External deterrence",
    status: "Moderate risk",
    detail: "Neighboring factions probing markets",
  },
  {
    title: "Treasury liquidity",
    status: "Low risk",
    detail: "Healthy reserves & inflows",
  },
  {
    title: "Formation morale",
    status: "Watch",
    detail: "Two squads reported burnout",
  },
];

const chamberProposals = [
  {
    title: "Protocol Upgrade Rollout",
    effect: "Sequencer redundancy patch ready for council vote",
    sponsors: "Protocol Guard · Mesh Vanguard",
  },
  {
    title: "Treasury Split Adjustment",
    effect: "Rebalance civic vs operations disbursements",
    sponsors: "Arcadian Treasury · Civic Union",
  },
  {
    title: "Formation Tooling Bundle",
    effect: "Approve guild ops stack for logistics squads",
    sponsors: "Formation League · Guardian Circle",
  },
];

const Invision: React.FC = () => {
  return (
    <div className="app-page flex flex-col gap-5">
      <section className="bg-panel space-y-4 rounded-2xl border border-border p-6">
        <div>
          <p className="text-xs tracking-wide text-muted uppercase">
            Current governance state
          </p>
          <h1 className="text-text text-2xl font-semibold">
            {governanceState.label}
          </h1>
          <p className="text-sm text-muted">{governanceState.subtitle}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          {governanceState.summary}
        </p>
        <div className="grid gap-3 text-center sm:grid-cols-3">
          {governanceState.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-border px-3 py-3"
            >
              <p className="text-xs tracking-wide text-muted uppercase">
                {metric.label}
              </p>
              <p className="text-text text-2xl font-semibold">{metric.value}</p>
              <p className="text-xs text-muted">{metric.trend}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Factions</CardTitle>
          </CardHeader>
          <CardContent className="text-text grid gap-3 text-sm sm:grid-cols-2">
            {factions.map((faction) => (
              <div
                key={faction.name}
                className="bg-panel-alt rounded-xl border border-border px-4 py-3"
              >
                <p className="text-text text-base font-semibold">{faction.name}</p>
                <p className="text-xs tracking-wide text-primary uppercase">
                  {faction.members}
                </p>
                <p className="text-xs text-muted">{faction.stance}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Treasury & economy</CardTitle>
          </CardHeader>
          <CardContent className="text-text space-y-3 text-sm">
            {economicIndicators.map((indicator) => (
              <div
                key={indicator.label}
                className="rounded-xl border border-border px-3 py-2"
              >
                <p className="text-xs tracking-wide text-muted uppercase">
                  {indicator.label}
                </p>
                <p className="text-text text-lg font-semibold">
                  {indicator.value}
                </p>
                <p className="text-xs text-muted">{indicator.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Risk dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-text grid gap-3 text-sm sm:grid-cols-2">
            {riskSignals.map((signal) => (
              <div
                key={signal.title}
                className="rounded-xl border border-border px-3 py-3"
              >
                <p className="text-xs tracking-wide text-muted uppercase">
                  {signal.title}
                </p>
                <p className="text-base font-semibold text-primary">
                  {signal.status}
                </p>
                <p className="text-xs text-muted">{signal.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>General chamber proposals</CardTitle>
          </CardHeader>
          <CardContent className="text-text space-y-3 text-sm">
            {chamberProposals.map((proposal) => (
              <div
                key={proposal.title}
                className="rounded-xl border border-border px-3 py-3"
              >
                <p className="text-text text-base font-semibold">
                  {proposal.title}
                </p>
                <p className="text-xs tracking-wide text-primary uppercase">
                  {proposal.effect}
                </p>
                <p className="text-xs text-muted">{proposal.sponsors}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Invision;

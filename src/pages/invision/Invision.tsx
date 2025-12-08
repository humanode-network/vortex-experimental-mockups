import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HintLabel } from "@/components/Hint";

const governanceState = {
  label: "Egalitarian Republic",
  metrics: [
    { label: "Legitimacy", value: "78%" },
    { label: "Stability", value: "72%" },
    { label: "Centralization", value: "44%" },
  ],
};

const factions = [
  {
    name: "Protocol Keepers",
    members: 61,
    votes: "28",
    acm: "6,850",
    stance: "Pushes for harder liveness guarantees and validator neutrality.",
  },
  {
    name: "Formation Guild",
    members: 54,
    votes: "21",
    acm: "5,120",
    stance:
      "Wants Formation to own more budget and streamline squad approvals.",
  },
  {
    name: "Mesh Vanguard",
    members: 48,
    votes: "19",
    acm: "4,930",
    stance: "Advocates anonymous identities and stronger mesh privacy.",
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-panel-alt rounded-2xl border border-border px-6 py-5 text-center shadow-sm sm:col-span-2 lg:col-span-3">
          <p className="text-xs tracking-wide text-muted uppercase">
            Governance model
          </p>
          <h1 className="text-text text-2xl font-semibold">
            {governanceState.label}
          </h1>
        </div>
        {governanceState.metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-panel rounded-2xl border border-border px-3 py-3 text-center"
          >
            <p className="text-xs tracking-wide text-muted uppercase">
              {metric.label}
            </p>
            <p className="text-text text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Largest factions</CardTitle>
          </CardHeader>
          <CardContent className="text-text grid gap-4 text-sm sm:grid-cols-2">
            {factions.map((faction) => (
              <div
                key={faction.name}
                className="bg-panel-alt rounded-2xl border border-border px-5 py-4 shadow-sm"
              >
                <p className="text-text text-lg font-semibold">
                  {faction.name}
                </p>
                <p className="text-xs tracking-wide text-primary uppercase">
                  {faction.stance}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-panel rounded-xl border border-border px-2 py-2">
                    <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                      Members
                    </p>
                    <p className="text-lg font-semibold">{faction.members}</p>
                  </div>
                  <div className="bg-panel rounded-xl border border-border px-2 py-2">
                    <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                      Votes, %
                    </p>
                    <p className="text-lg font-semibold">{faction.votes}</p>
                  </div>
                  <div className="bg-panel rounded-xl border border-border px-2 py-2">
                    <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                      <HintLabel termId="acm">ACM</HintLabel>
                    </p>
                    <p className="text-lg font-semibold capitalize">
                      {faction.acm}
                    </p>
                  </div>
                </div>
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

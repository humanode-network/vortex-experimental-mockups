import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HintLabel } from "@/components/Hint";
import { SearchBar } from "@/components/SearchBar";
import { Surface } from "@/components/Surface";
import { AppPage } from "@/components/AppPage";

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
  const [search, setSearch] = useState("");
  const [factionSort, setFactionSort] = useState<"members" | "votes" | "acm">(
    "members",
  );
  const filteredFactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...factions]
      .filter(
        (f) =>
          term.length === 0 ||
          f.name.toLowerCase().includes(term) ||
          f.stance.toLowerCase().includes(term),
      )
      .sort((a, b) => {
        if (factionSort === "members") return b.members - a.members;
        if (factionSort === "votes")
          return parseInt(b.votes, 10) - parseInt(a.votes, 10);
        return (
          parseInt(b.acm.replace(/[,]/g, ""), 10) -
          parseInt(a.acm.replace(/[,]/g, ""), 10)
        );
      });
  }, [search, factionSort]);

  return (
    <AppPage pageId="invision" variant="stack5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Surface
          variant="panelAlt"
          className="px-6 py-5 text-center sm:col-span-2 lg:col-span-3"
        >
          <p className="text-xs tracking-wide text-muted uppercase">
            Governance model
          </p>
          <h1 className="text-2xl font-semibold text-text">
            {governanceState.label}
          </h1>
        </Surface>
        {governanceState.metrics.map((metric) => (
          <Surface
            key={metric.label}
            variant="panel"
            className="px-3 py-3 text-center"
          >
            <p className="text-xs tracking-wide text-muted uppercase">
              {metric.label}
            </p>
            <p className="text-2xl font-semibold text-text">{metric.value}</p>
          </Surface>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search factions, blocs, proposals…"
        ariaLabel="Search invision"
        filtersConfig={[
          {
            key: "factionSort",
            label: "Sort factions",
            options: [
              { value: "members", label: "Members (desc)" },
              { value: "votes", label: "Votes (desc)" },
              { value: "acm", label: "ACM (desc)" },
            ],
          },
        ]}
        filtersState={{ factionSort }}
        onFiltersChange={(next) => {
          if (next.factionSort)
            setFactionSort(next.factionSort as "members" | "votes" | "acm");
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Largest factions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-text sm:grid-cols-2">
            {filteredFactions.map((faction) => (
              <div key={faction.name} className="contents">
                <Surface variant="panelAlt" className="px-5 py-4">
                  <p className="text-lg font-semibold text-text">
                    {faction.name}
                  </p>
                  <p className="text-xs tracking-wide text-primary uppercase">
                    {faction.stance}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-2 py-2"
                    >
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        Members
                      </p>
                      <p className="text-lg font-semibold">{faction.members}</p>
                    </Surface>
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-2 py-2"
                    >
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        Votes, %
                      </p>
                      <p className="text-lg font-semibold">{faction.votes}</p>
                    </Surface>
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-2 py-2"
                    >
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        <HintLabel termId="acm">ACM</HintLabel>
                      </p>
                      <p className="text-lg font-semibold capitalize">
                        {faction.acm}
                      </p>
                    </Surface>
                  </div>
                </Surface>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Treasury & economy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text">
            {economicIndicators.map((indicator) => (
              <div
                key={indicator.label}
                className="rounded-xl border border-border px-3 py-2"
              >
                <p className="text-xs tracking-wide text-muted uppercase">
                  {indicator.label}
                </p>
                <p className="text-lg font-semibold text-text">
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
          <CardContent className="grid gap-3 text-sm text-text sm:grid-cols-2">
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
          <CardContent className="space-y-3 text-sm text-text">
            {chamberProposals.map((proposal) => (
              <div
                key={proposal.title}
                className="rounded-xl border border-border px-3 py-3"
              >
                <p className="text-base font-semibold text-text">
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
    </AppPage>
  );
};

export default Invision;

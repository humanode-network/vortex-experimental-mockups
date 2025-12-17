import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { HintLabel } from "@/components/Hint";
import { SearchBar } from "@/components/SearchBar";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { factions as allFactions } from "@/data/mock/factions";
import { Kicker } from "@/components/Kicker";
import {
  invisionChamberProposals as chamberProposals,
  invisionEconomicIndicators as economicIndicators,
  invisionGovernanceState as governanceState,
  invisionRiskSignals as riskSignals,
} from "@/data/mock/invision";

const Invision: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    factionSort: "members" | "votes" | "acm";
  }>({ factionSort: "members" });
  const { factionSort } = filters;
  const filteredFactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...allFactions]
      .filter(
        (f) =>
          term.length === 0 ||
          f.name.toLowerCase().includes(term) ||
          f.description.toLowerCase().includes(term),
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
    <div className="flex flex-col gap-5">
      <PageHint pageId="invision" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Surface
          variant="panelAlt"
          className="px-6 py-5 text-center sm:col-span-2 lg:col-span-3"
        >
          <Kicker align="center">Governance model</Kicker>
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
            <Kicker align="center">{metric.label}</Kicker>
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
        filtersState={filters}
        onFiltersChange={setFilters}
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
                  <Kicker className="text-primary">
                    {faction.description}
                  </Kicker>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-2 py-2"
                    >
                      <Kicker align="center" className="text-[0.7rem]">
                        Members
                      </Kicker>
                      <p className="text-lg font-semibold">{faction.members}</p>
                    </Surface>
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-2 py-2"
                    >
                      <Kicker align="center" className="text-[0.7rem]">
                        Votes, %
                      </Kicker>
                      <p className="text-lg font-semibold">{faction.votes}</p>
                    </Surface>
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="control"
                      className="px-2 py-2"
                    >
                      <Kicker align="center" className="text-[0.7rem]">
                        <HintLabel termId="acm">ACM</HintLabel>
                      </Kicker>
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
                <Kicker>{indicator.label}</Kicker>
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
                <Kicker>{signal.title}</Kicker>
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
                <Kicker className="text-primary">{proposal.effect}</Kicker>
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

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { SearchBar } from "@/components/SearchBar";
import { MetricTile } from "@/components/MetricTile";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { apiFactions } from "@/lib/apiClient";
import type { FactionDto } from "@/types/api";

const Factions: React.FC = () => {
  const [factions, setFactions] = useState<FactionDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{
    focusFilter: string;
    sortBy: "members" | "votes" | "acm";
  }>({ focusFilter: "any", sortBy: "members" });
  const { focusFilter, sortBy } = filters;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFactions();
        if (!active) return;
        setFactions(res.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setFactions([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const list = factions ?? [];
    const totalMembers = list.reduce((sum, f) => sum + f.members, 0);
    const totalVotes = list.reduce((sum, f) => sum + parseInt(f.votes, 10), 0);
    const totalAcm = list.reduce(
      (sum, f) => sum + parseInt(f.acm.replace(/[,]/g, ""), 10),
      0,
    );
    return {
      totalMembers,
      totalVotes,
      totalAcm,
      totalFactions: list.length,
    };
  }, [factions]);

  const focusOptions = useMemo(
    () => Array.from(new Set((factions ?? []).map((f) => f.focus))),
    [factions],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...(factions ?? [])]
      .filter((f) => {
        const matchesTerm =
          term.length === 0 ||
          f.name.toLowerCase().includes(term) ||
          f.description.toLowerCase().includes(term) ||
          f.focus.toLowerCase().includes(term);
        const matchesFocus =
          focusFilter === "any" ? true : f.focus === focusFilter;
        return matchesTerm && matchesFocus;
      })
      .sort((a, b) => {
        if (sortBy === "members") return b.members - a.members;
        if (sortBy === "votes")
          return parseInt(b.votes, 10) - parseInt(a.votes, 10);
        return (
          parseInt(b.acm.replace(/[,]/g, ""), 10) -
          parseInt(a.acm.replace(/[,]/g, ""), 10)
        );
      });
  }, [factions, query, focusFilter, sortBy]);

  const showResultsOnly = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="factions" />
      {factions === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading factions…
        </Card>
      ) : null}
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          Factions unavailable: {loadError}
        </Card>
      ) : null}
      {factions !== null && factions.length === 0 && !loadError ? (
        <NoDataYetBar label="factions" />
      ) : null}
      {!showResultsOnly && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total factions" value={totals.totalFactions} />
            <MetricTile label="Members" value={totals.totalMembers} />
            <MetricTile label="Votes" value={totals.totalVotes} />
            <MetricTile
              label={<HintLabel termId="acm" termText="ACM" />}
              value={totals.totalAcm}
            />
          </section>

          <SearchBar
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search factions by name, focus, tags…"
            ariaLabel="Search factions"
            filtersConfig={[
              {
                key: "focusFilter",
                label: "Focus",
                options: [
                  { value: "any", label: "Any focus" },
                  ...focusOptions.map((opt) => ({ value: opt, label: opt })),
                ],
              },
              {
                key: "sortBy",
                label: "Sort by",
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

          <section
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-live="polite"
          >
            {(factions ?? []).map((faction) => (
              <Card key={faction.id} className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle>{faction.name}</CardTitle>
                  <p className="line-clamp-2 min-h-10 text-sm text-muted">
                    {faction.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-text">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <StatTile
                      label="Members"
                      value={faction.members}
                      className="px-2 py-2"
                      valueClassName="text-lg"
                    />
                    <StatTile
                      label="Votes"
                      value={faction.votes}
                      className="px-2 py-2"
                      valueClassName="text-lg"
                    />
                    <StatTile
                      label={<HintLabel termId="acm" termText="ACM" />}
                      value={faction.acm}
                      className="px-2 py-2"
                      valueClassName="text-lg"
                    />
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/app/factions/${faction.id}`}>View faction</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      )}

      {showResultsOnly && (
        <section className="space-y-3" aria-live="polite">
          {filtered.length === 0 && (
            <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
              No factions match this search.
            </Card>
          )}
          {filtered.map((faction) => (
            <Card key={faction.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {faction.name}
                  </p>
                  <p className="text-xs text-muted">{faction.description}</p>
                </div>
                <div className="grid min-w-[180px] grid-rows-1 justify-items-start gap-2 text-xs text-muted">
                  <Badge variant="outline">Members: {faction.members}</Badge>
                </div>
                <Button asChild size="sm">
                  <Link to={`/app/factions/${faction.id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
};

export default Factions;

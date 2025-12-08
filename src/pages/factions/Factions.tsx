import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HintLabel } from "@/components/Hint";
import { factions } from "./factionData";

const Factions: React.FC = () => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const totals = useMemo(() => {
    const totalMembers = factions.reduce((sum, f) => sum + f.members, 0);
    const totalVotes = factions.reduce(
      (sum, f) => sum + parseInt(f.votes, 10),
      0,
    );
    const totalAcm = factions.reduce(
      (sum, f) => sum + parseInt(f.acm.replace(/[,]/g, ""), 10),
      0,
    );
    return {
      totalMembers,
      totalVotes,
      totalAcm,
      totalFactions: factions.length,
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return factions;
    return factions.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term) ||
        f.focus.toLowerCase().includes(term),
    );
  }, [query]);

  const showResultsOnly = query.trim().length > 0;

  return (
    <div className="app-page flex flex-col gap-6">
      <div>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by faction, focus, description…"
          aria-label="Search factions"
        />
      </div>

      {!showResultsOnly && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center shadow-sm">
              <p className="text-xs tracking-wide text-muted uppercase">
                Total factions
              </p>
              <p className="text-text text-2xl font-semibold">
                {totals.totalFactions}
              </p>
            </div>
            <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center shadow-sm">
              <p className="text-xs tracking-wide text-muted uppercase">
                Members
              </p>
              <p className="text-text text-2xl font-semibold">
                {totals.totalMembers}
              </p>
            </div>
            <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center shadow-sm">
              <p className="text-xs tracking-wide text-muted uppercase">
                Votes
              </p>
              <p className="text-text text-2xl font-semibold">
                {totals.totalVotes}
              </p>
            </div>
            <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center shadow-sm">
              <p className="text-xs tracking-wide text-muted uppercase">
                <HintLabel termId="acm" termText="ACM" />
              </p>
              <p className="text-text text-2xl font-semibold">
                {totals.totalAcm}
              </p>
            </div>
          </section>

          <section
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-live="polite"
          >
            {factions.map((faction) => (
              <Card
                key={faction.id}
                className="bg-panel h-full border border-border"
              >
                <CardHeader className="pb-2">
                  <CardTitle>{faction.name}</CardTitle>
                  <p className="line-clamp-2 min-h-10 text-sm text-muted">
                    {faction.description}
                  </p>
                </CardHeader>
                <CardContent className="text-text space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-panel-alt rounded-xl border border-border px-2 py-2">
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        Members
                      </p>
                      <p className="text-lg font-semibold">{faction.members}</p>
                    </div>
                    <div className="bg-panel-alt rounded-xl border border-border px-2 py-2">
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        Votes
                      </p>
                      <p className="text-lg font-semibold">{faction.votes}</p>
                    </div>
                    <div className="bg-panel-alt rounded-xl border border-border px-2 py-2">
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        <HintLabel termId="acm" termText="ACM" />
                      </p>
                      <p className="text-lg font-semibold">{faction.acm}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/factions/${faction.id}`}>View faction</Link>
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
            <Card className="bg-panel border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              No factions match this search.
            </Card>
          )}
          {filtered.map((faction) => (
            <Card key={faction.id} className="bg-panel border border-border">
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-text text-sm font-semibold">
                    {faction.name}
                  </p>
                  <p className="text-xs text-muted">{faction.description}</p>
                </div>
                <div className="grid min-w-[180px] grid-rows-1 justify-items-start gap-2 text-xs text-muted">
                  <Badge variant="outline">Members: {faction.members}</Badge>
                </div>
                <Button asChild size="sm">
                  <Link to={`/factions/${faction.id}`}>Open</Link>
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

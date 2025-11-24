import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Faction = {
  id: string;
  name: string;
  description: string;
  members: number;
  threads: number;
  activity: "none" | "low" | "average" | "high" | "very high";
  focus: string;
};

const factions: Faction[] = [
  {
    id: "mesh-vanguard",
    name: "Mesh Vanguard",
    description:
      "Reliability guild that keeps the mesh humming and telemetry tight.",
    members: 48,
    threads: 22,
    activity: "high",
    focus: "Reliability & ops",
  },
  {
    id: "formation-guild",
    name: "Formation Guild",
    description:
      "Logistics squads that coordinate projects, milestones, and squads.",
    members: 54,
    threads: 18,
    activity: "average",
    focus: "Execution & delivery",
  },
  {
    id: "protocol-keepers",
    name: "Protocol Keepers",
    description:
      "Protocol-first faction focused on validators, liveness, and upgrades.",
    members: 61,
    threads: 27,
    activity: "very high",
    focus: "Core protocol",
  },
  {
    id: "treasury-collective",
    name: "Treasury Collective",
    description:
      "Treasury and economics faction watching budgets and incentives.",
    members: 37,
    threads: 11,
    activity: "average",
    focus: "Economics",
  },
  {
    id: "guardian-circle",
    name: "Guardian Circle",
    description: "Mentorship and safety net for new governors and operators.",
    members: 29,
    threads: 9,
    activity: "low",
    focus: "Mentorship",
  },
  {
    id: "research-lab",
    name: "Research Lab",
    description:
      "Cryptobiometrics and deterrence research to keep threats in check.",
    members: 33,
    threads: 14,
    activity: "high",
    focus: "Research",
  },
];

const Factions: React.FC = () => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const totals = useMemo(() => {
    const totalMembers = factions.reduce((sum, f) => sum + f.members, 0);
    const totalThreads = factions.reduce((sum, f) => sum + f.threads, 0);
    const activityCounts = factions.reduce<Record<string, number>>((acc, f) => {
      acc[f.activity] = (acc[f.activity] || 0) + 1;
      return acc;
    }, {});
    const mostActive =
      Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "mixed";
    return {
      totalMembers,
      totalThreads,
      mostActive,
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
                Threads
              </p>
              <p className="text-text text-2xl font-semibold">
                {totals.totalThreads}
              </p>
            </div>
            <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center shadow-sm">
              <p className="text-xs tracking-wide text-muted uppercase">
                Activity mix
              </p>
              <p className="text-text text-2xl font-semibold capitalize">
                {totals.mostActive}
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
                </CardHeader>
                <CardContent className="text-text space-y-3 text-sm">
                  <p className="text-muted">{faction.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-panel-alt rounded-xl border border-border px-2 py-2">
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        Members
                      </p>
                      <p className="text-lg font-semibold">{faction.members}</p>
                    </div>
                    <div className="bg-panel-alt rounded-xl border border-border px-2 py-2">
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        Threads
                      </p>
                      <p className="text-lg font-semibold">{faction.threads}</p>
                    </div>
                    <div className="bg-panel-alt rounded-xl border border-border px-2 py-2">
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        Activity
                      </p>
                      <p className="text-lg font-semibold capitalize">
                        {faction.activity}
                      </p>
                    </div>
                  </div>
                  <div className="grid min-h-[64px] grid-rows-2 justify-items-start gap-2">
                    <Badge variant="outline">Threads: {faction.threads}</Badge>
                    <Badge variant="outline">
                      Activity: {faction.activity}
                    </Badge>
                  </div>
                  <Button size="sm" className="w-full">
                    View faction
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
                <div className="grid min-w-[180px] grid-rows-2 justify-items-start gap-2 text-xs text-muted">
                  <Badge variant="outline">Members: {faction.members}</Badge>
                  <Badge variant="outline">
                    Threads: {faction.threads} · Activity: {faction.activity}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
};

export default Factions;

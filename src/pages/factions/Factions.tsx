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
  delegates: number;
  projects: number;
  focus: string;
};

const factions: Faction[] = [
  {
    id: "mesh-vanguard",
    name: "Mesh Vanguard",
    description:
      "Reliability guild that keeps the mesh humming and telemetry tight.",
    members: 48,
    delegates: 12,
    projects: 6,
    focus: "Reliability & ops",
  },
  {
    id: "formation-guild",
    name: "Formation Guild",
    description:
      "Logistics squads that coordinate projects, milestones, and squads.",
    members: 54,
    delegates: 10,
    projects: 9,
    focus: "Execution & delivery",
  },
  {
    id: "protocol-keepers",
    name: "Protocol Keepers",
    description:
      "Protocol-first faction focused on validators, liveness, and upgrades.",
    members: 61,
    delegates: 15,
    projects: 7,
    focus: "Core protocol",
  },
  {
    id: "treasury-collective",
    name: "Treasury Collective",
    description:
      "Treasury and economics faction watching budgets and incentives.",
    members: 37,
    delegates: 9,
    projects: 5,
    focus: "Economics",
  },
  {
    id: "guardian-circle",
    name: "Guardian Circle",
    description: "Mentorship and safety net for new governors and operators.",
    members: 29,
    delegates: 6,
    projects: 3,
    focus: "Mentorship",
  },
  {
    id: "research-lab",
    name: "Research Lab",
    description:
      "Cryptobiometrics and deterrence research to keep threats in check.",
    members: 33,
    delegates: 8,
    projects: 4,
    focus: "Research",
  },
];

const Factions: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const totals = useMemo(() => {
    const totalMembers = factions.reduce((sum, f) => sum + f.members, 0);
    const totalDelegates = factions.reduce((sum, f) => sum + f.delegates, 0);
    const totalProjects = factions.reduce((sum, f) => sum + f.projects, 0);
    return {
      totalMembers,
      totalDelegates,
      totalProjects,
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
                Delegates
              </p>
              <p className="text-text text-2xl font-semibold">
                {totals.totalDelegates}
              </p>
            </div>
            <div className="bg-panel-alt rounded-2xl border border-border px-4 py-4 text-center shadow-sm">
              <p className="text-xs tracking-wide text-muted uppercase">
                Active projects
              </p>
              <p className="text-text text-2xl font-semibold">
                {totals.totalProjects}
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
                  <div className="grid grid-cols-1 gap-2 text-center">
                    <div className="bg-panel-alt rounded-xl border border-border px-2 py-2">
                      <p className="text-[0.7rem] tracking-wide text-muted uppercase">
                        Members
                      </p>
                      <p className="text-lg font-semibold">{faction.members}</p>
                    </div>
                  </div>
                  <div className="grid min-h-[64px] grid-rows-2 justify-items-start gap-2">
                    <Badge variant="outline">{faction.focus}</Badge>
                    <Badge variant="outline">ID: {faction.id}</Badge>
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
                <div className="grid min-w-[160px] grid-rows-2 justify-items-start gap-2 text-xs text-muted">
                  <Badge variant="outline">{faction.focus}</Badge>
                  <Badge variant="outline">Members: {faction.members}</Badge>
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

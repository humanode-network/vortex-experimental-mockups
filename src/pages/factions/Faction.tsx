import { useMemo } from "react";
import { useParams, Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { factions } from "./factionData";

const Faction: React.FC = () => {
  const { id } = useParams();
  const faction = useMemo(() => factions.find((f) => f.id === id), [id]);

  if (!faction) {
    return (
      <div className="app-page flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-(--text)">
          Faction not found
        </h1>
        <Button asChild size="sm">
          <Link to="/factions">Back to factions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="app-page flex flex-col gap-6">
      <section className="bg-panel rounded-2xl border border-border p-6">
        <div className="grid items-center gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex justify-center lg:justify-start">
            <div className="bg-panel-alt flex h-24 w-24 items-center justify-center rounded-full border-4 border-border text-lg font-semibold text-muted shadow-inner">
              {faction.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col gap-1 text-center lg:text-left">
            <p className="text-xs tracking-wide text-muted uppercase">
              Faction
            </p>
            <h1 className="text-text text-3xl font-semibold">{faction.name}</h1>
            <p className="text-sm text-muted">{faction.description}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
            <Button asChild size="sm">
              <Link to="/factions">Back to factions</Link>
            </Button>
            <div className="bg-panel-alt inline-flex w-48 items-center justify-between rounded-full border border-border px-4 py-2">
              <span className="text-xs tracking-wide text-muted uppercase">
                Focus
              </span>
              <span className="font-semibold text-primary">
                {faction.focus}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Members", value: faction.members.toString() },
          { label: "Votes", value: faction.votes },
          { label: "ACM", value: faction.acm },
          { label: "Focus", value: faction.focus },
        ].map((stat) => (
          <Card key={stat.label} className="h-full text-center">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs tracking-wide text-muted uppercase">
                {stat.label}
              </p>
              <p className="text-text text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            {faction.goals.map((goal) => (
              <div
                key={goal}
                className="bg-panel-alt text-text rounded-xl border border-border px-3 py-2"
              >
                {goal}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <div className="bg-panel-alt text-text rounded-xl border border-border px-3 py-2">
              <p className="text-xs tracking-wide text-muted uppercase">
                Identity
              </p>
              <p className="text-sm font-semibold">{faction.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Members: {faction.members}</Badge>
              <Badge variant="outline">Votes: {faction.votes}</Badge>
              <Badge variant="outline">ACM: {faction.acm}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Active initiatives</CardTitle>
        </CardHeader>
        <CardContent className="text-text grid gap-3 text-sm sm:grid-cols-3">
          {faction.initiatives.map((item) => (
            <div
              key={item}
              className="bg-panel-alt rounded-xl border border-border px-3 py-3"
            >
              <p className="font-semibold">{item}</p>
              <p className="text-xs text-muted">Initiative</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Faction;

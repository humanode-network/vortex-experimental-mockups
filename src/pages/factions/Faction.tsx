import { useMemo } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { factions } from "./factionData";
import { HintLabel } from "@/components/Hint";

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

  const activity = [
    {
      title: `${faction.name} budget motion`,
      action: "Opened proposal",
      location: "Treasury",
    },
    { title: "Governance drill", action: "Coordinated", location: "Protocol" },
    {
      title: "Formation ops stack",
      action: "Pushed milestone",
      location: "Formation",
    },
    {
      title: "Privacy sprint",
      action: "Filed research note",
      location: "Research",
    },
  ];

  const roster = [
    {
      name: "John Doe",
      role: faction.focus,
      tag: (
        <>
          <HintLabel termId="acm" className="mr-1">
            ACM
          </HintLabel>
          182
        </>
      ),
    },
    { name: "Raamara", role: "Ops & delivery", tag: "Votes 52" },
    { name: "Nyx", role: "Signals & privacy", tag: "MM 81" },
  ];

  const resources = [
    { label: "Charter & mandate", href: "#" },
    { label: "Roadmap", href: "#" },
    { label: "How to contribute", href: "#" },
  ];

  const initiatives = [
    { title: "Deterrence sim lab", stage: "Launched", location: "Formation" },
    {
      title: "Sequencer redundancy rollout",
      stage: "Chamber vote",
      location: "Protocol chamber",
    },
    {
      title: "Treasury split recalibration",
      stage: "Proposal pool",
      location: "Treasury chamber",
    },
    { title: "Guild ops stack", stage: "Launched", location: "Formation" },
    {
      title: "Mentorship cohort",
      stage: "Gathering team",
      location: "Formation",
    },
    {
      title: "Privacy sprint",
      stage: "Proposal pool",
      location: "Research chamber",
    },
  ];

  return (
    <div className="app-page flex flex-col gap-6">
      <section className="bg-panel rounded-2xl border border-border p-6">
        <div className="grid items-center gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex justify-center lg:justify-start">
            <div className="bg-panel-alt flex h-24 w-24 items-center justify-center rounded-full border-4 border-border text-lg font-semibold text-muted shadow-inner">
              {faction.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-text text-4xl font-semibold">{faction.name}</h1>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
            <Button size="sm">Join faction</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Members", value: faction.members.toString() },
          { label: "Votes", value: faction.votes },
          { label: "ACM", value: faction.acm },
          { label: "Creator", value: roster[0]?.name ?? "" },
        ].map((stat) => (
          <Card key={stat.label} className="h-full text-center">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs tracking-wide text-muted uppercase">
                {stat.label === "ACM" ? (
                  <HintLabel termId="acm">{stat.label}</HintLabel>
                ) : (
                  stat.label
                )}
              </p>
              <p className="text-text text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active initiatives</CardTitle>
          </CardHeader>
          <CardContent className="text-text grid gap-3 text-sm sm:grid-cols-3">
            {initiatives.map((item) => (
              <div
                key={item.title}
                className="bg-panel-alt flex h-[140px] flex-col items-center justify-between rounded-xl border border-border px-3 py-3 text-center"
              >
                <p className="h-10 overflow-hidden text-sm leading-snug font-semibold">
                  {item.title}
                </p>
                <p className="line-clamp-1 text-xs text-muted">
                  {item.location}
                </p>
                <p className="text-xs font-semibold text-primary">
                  {item.stage}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="text-text space-y-2 text-sm">
            {resources.map((item) => (
              <div
                key={item.label}
                className="bg-panel-alt rounded-xl border border-border px-3 py-2"
              >
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-muted">
                  {item.href === "#" ? "Internal link" : item.href}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Roster highlights</CardTitle>
        </CardHeader>
        <CardContent className="text-text grid gap-3 text-sm sm:grid-cols-3">
          {roster.map((member) => (
            <div
              key={member.name}
              className="bg-panel-alt rounded-xl border border-border px-3 py-3 text-center"
            >
              <p className="text-base font-semibold">{member.name}</p>
              <p className="text-xs text-muted">{member.role}</p>
              <p className="text-xs font-semibold text-primary">{member.tag}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="text-text grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
          {activity.map((item) => (
            <div
              key={item.title}
              className="bg-panel-alt rounded-xl border border-border px-3 py-3 text-center"
            >
              <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
              <p className="line-clamp-1 text-xs tracking-wide text-primary uppercase">
                {item.action}
              </p>
              <p className="line-clamp-1 text-xs text-muted">{item.location}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Faction;

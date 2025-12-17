import { useMemo } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { factions } from "@/data/mock/factions";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";

const Faction: React.FC = () => {
  const { id } = useParams();
  const faction = useMemo(() => factions.find((f) => f.id === id), [id]);

  if (!faction) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">Faction not found</h1>
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
    {
      name: "Nyx",
      role: "Signals & privacy",
      tag: (
        <>
          <HintLabel termId="meritocratic_measure" className="mr-1">
            MM
          </HintLabel>
          81
        </>
      ),
    },
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
      stage: <HintLabel termId="chamber_vote">Chamber vote</HintLabel>,
      location: "Protocol chamber",
    },
    {
      title: "Treasury split recalibration",
      stage: <HintLabel termId="proposal_pools">Proposal pool</HintLabel>,
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
      stage: <HintLabel termId="proposal_pools">Proposal pool</HintLabel>,
      location: "Research chamber",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="faction" />
      <Surface
        as="section"
        variant="panel"
        radius="2xl"
        shadow="card"
        className="p-6"
      >
        <div className="grid items-center gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex justify-center lg:justify-start">
            <AvatarPlaceholder
              initials={faction.name.substring(0, 2).toUpperCase()}
              size="md"
            />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-4xl font-semibold text-text">{faction.name}</h1>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
            <Button size="sm">Join faction</Button>
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Members", value: faction.members.toString() },
          { label: "Votes", value: faction.votes },
          { label: "ACM", value: faction.acm },
          { label: "Creator", value: roster[0]?.name ?? "" },
        ].map((stat) => (
          <Card key={stat.label} className="h-full text-center">
            <CardContent className="space-y-1 p-4">
              <Kicker align="center">
                {stat.label === "ACM" ? (
                  <HintLabel termId="acm">{stat.label}</HintLabel>
                ) : (
                  stat.label
                )}
              </Kicker>
              <p className="text-2xl font-semibold text-text">{stat.value}</p>
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
            <Surface
              key={goal}
              variant="panelAlt"
              radius="xl"
              shadow="control"
              className="px-3 py-2 text-text"
            >
              {goal}
            </Surface>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active initiatives</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-text sm:grid-cols-3">
            {initiatives.map((item) => (
              <Surface
                key={item.title}
                variant="panelAlt"
                radius="xl"
                shadow="tile"
                className="flex h-[140px] flex-col items-center justify-between px-3 py-3 text-center"
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
              </Surface>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-text">
            {resources.map((item) => (
              <Surface
                key={item.label}
                variant="panelAlt"
                radius="xl"
                shadow="control"
                className="px-3 py-2"
              >
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-muted">
                  {item.href === "#" ? "Internal link" : item.href}
                </p>
              </Surface>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Roster highlights</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-text sm:grid-cols-3">
          {roster.map((member) => (
            <Surface
              key={member.name}
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-3 py-3 text-center"
            >
              <p className="text-base font-semibold">{member.name}</p>
              <p className="text-xs text-muted">{member.role}</p>
              <p className="text-xs font-semibold text-primary">{member.tag}</p>
            </Surface>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-2 text-sm text-text sm:grid-cols-2 xl:grid-cols-3">
          {activity.map((item) => (
            <Surface
              key={item.title}
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="px-3 py-3 text-center"
            >
              <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
              <Kicker align="center" className="line-clamp-1 text-primary">
                {item.action}
              </Kicker>
              <p className="line-clamp-1 text-xs text-muted">{item.location}</p>
            </Surface>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Faction;

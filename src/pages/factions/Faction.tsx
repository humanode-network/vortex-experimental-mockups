import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { apiFaction, apiHumans, apiProposals } from "@/lib/apiClient";
import type {
  FactionDto,
  HumanNodeDto,
  ProposalListItemDto,
} from "@/types/api";

const Faction: React.FC = () => {
  const { id } = useParams();
  const [faction, setFaction] = useState<FactionDto | null>(null);
  const [humansById, setHumansById] = useState<Record<string, HumanNodeDto>>(
    {},
  );
  const [proposals, setProposals] = useState<ProposalListItemDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [factionRes, humansRes, proposalsRes] = await Promise.all([
          apiFaction(id),
          apiHumans(),
          apiProposals(),
        ]);
        if (!active) return;
        setFaction(factionRes);
        setHumansById(
          Object.fromEntries(humansRes.items.map((h) => [h.id, h] as const)),
        );
        setProposals(proposalsRes.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setFaction(null);
        setHumansById({});
        setProposals([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (!faction) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">Faction not found</h1>
        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : null}
        <Button asChild size="sm">
          <Link to="/app/factions">Back to factions</Link>
        </Button>
      </div>
    );
  }

  const roster = faction.roster.map((member) => {
    const node = humansById[member.humanNodeId];
    const name = node?.name ?? member.humanNodeId;
    const tag =
      member.tag.kind === "acm" ? (
        <>
          <HintLabel termId="acm" className="mr-1">
            ACM
          </HintLabel>
          {member.tag.value}
        </>
      ) : member.tag.kind === "mm" ? (
        <>
          <HintLabel termId="meritocratic_measure" className="mr-1">
            MM
          </HintLabel>
          {member.tag.value}
        </>
      ) : (
        member.tag.value
      );
    return { name, role: member.role, tag };
  });

  const initiatives = faction.initiatives.map((initiativeTitle) => {
    const matchingProposal = proposals.find(
      (proposal) => proposal.title === initiativeTitle,
    );

    if (!matchingProposal) {
      return {
        title: initiativeTitle,
        stage: "Initiative",
        location: faction.focus,
      };
    }

    const stage =
      matchingProposal.stage === "pool" ? (
        <HintLabel termId="proposal_pools">Proposal pool</HintLabel>
      ) : matchingProposal.stage === "vote" ? (
        <HintLabel termId="chamber_vote">Chamber vote</HintLabel>
      ) : matchingProposal.stage === "build" ? (
        <HintLabel termId="formation">Formation</HintLabel>
      ) : (
        "Draft"
      );

    return {
      title: initiativeTitle,
      stage,
      location: matchingProposal.chamber,
    };
  });

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
            <Badge variant="outline" size="sm" className="px-3 py-1">
              View-only
            </Badge>
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
          <CardContent className="text-sm text-text">
            <NoDataYetBar
              label="resources"
              description="Links and documents will appear here once published."
            />
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
        <CardContent className="text-sm text-text">
          <NoDataYetBar
            label="activity"
            description="Faction events will show up here once actions are recorded."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Faction;

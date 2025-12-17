import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { StatusPill } from "@/components/StatusPill";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { TierLabel } from "@/components/TierLabel";
import { ToggleGroup } from "@/components/ToggleGroup";
import {
  myProfile,
  proofToggleOptions,
  type ProofKey,
  type ProofSection,
} from "@/data/mock/humanNodeProfiles";

const Profile: React.FC = () => {
  const [activeProof, setActiveProof] = useState<ProofKey | "">("");
  const {
    heroStats,
    quickDetails,
    proofSections,
    governanceActions,
    projects,
    history,
  } = myProfile;
  const name = "JohnDoe";
  const governorActive = true;
  const humanNodeActive = true;
  const activeSection: ProofSection | null = activeProof
    ? proofSections[activeProof]
    : null;
  const proofOptions = proofToggleOptions.map((option) => ({
    value: option.key,
    label:
      option.label === "PoT" ? (
        <HintLabel termId="proof_of_time_pot">{option.label}</HintLabel>
      ) : option.label === "PoD" ? (
        <HintLabel termId="proof_of_devotion_pod">{option.label}</HintLabel>
      ) : option.label === "PoG" ? (
        <HintLabel termId="proof_of_governance_pog">{option.label}</HintLabel>
      ) : (
        option.label
      ),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="profile" />
      <Surface
        as="section"
        variant="panel"
        radius="2xl"
        shadow="card"
        className="p-6"
      >
        <div className="grid items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex justify-center lg:justify-start">
            <AvatarPlaceholder initials="MP" size="lg" />
          </div>
          <div className="flex flex-col items-center text-center">
            <Kicker align="center">My profile</Kicker>
            <h1 className="text-3xl font-semibold text-text">{name}</h1>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
            <Button variant="outline" size="sm">
              Edit profile
            </Button>
            <StatusPill
              label="Governor"
              value={governorActive ? "Active" : "Not active"}
              active={governorActive}
            />
            <StatusPill
              label="Human node"
              value={humanNodeActive ? "Active" : "Not active"}
              active={humanNodeActive}
            />
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {heroStats.map((stat) => (
          <Card key={stat.label} className="h-full">
            <CardContent className="space-y-1 p-4 text-center">
              <Kicker align="center">
                {stat.label === "ACM" ? (
                  <HintLabel termId="acm" termText="ACM" />
                ) : stat.label === "MM" ? (
                  <HintLabel termId="meritocratic_measure" termText="MM" />
                ) : (
                  stat.label
                )}
              </Kicker>
              <p className="text-2xl font-semibold text-text">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Governance summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>
                Mesh-first operator who liaises with validator squadrons and the
                Governance Council. Recent cycles focused on redundancy
                telemetry, guardian mentorship, and bringing quorum rituals to
                night shift governors.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Governance activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-scroll pr-2 sm:grid-cols-2 xl:grid-cols-3">
                {governanceActions.map((action) => (
                  <div key={action.title} className="group relative">
                    <Surface
                      variant="panelAlt"
                      radius="xl"
                      shadow="tile"
                      className="space-y-1 px-3 py-3 text-center"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-text">
                        {action.title}
                      </p>
                      <Kicker
                        align="center"
                        className="line-clamp-1 text-primary"
                      >
                        {action.action}
                      </Kicker>
                      <p className="line-clamp-1 text-xs text-muted">
                        {action.context}
                      </p>
                    </Surface>
                    <Surface
                      variant="panel"
                      radius="xl"
                      shadow="popover"
                      className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-64 -translate-x-1/2 p-3 text-left text-xs text-text opacity-0 transition group-hover:opacity-100"
                    >
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-muted">{action.context}</p>
                      <p className="mt-1 leading-snug">{action.detail}</p>
                    </Surface>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Formation projects</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-4 overflow-y-auto pr-1">
              {projects.map((project) => (
                <Surface
                  key={project.title}
                  variant="panelAlt"
                  radius="xl"
                  className="px-4 py-3"
                >
                  <div className="flex flex-col gap-1 text-center">
                    <p className="text-sm font-semibold text-text">
                      {project.title}
                    </p>
                    <Kicker align="center">{project.status}</Kicker>
                  </div>
                  <p className="text-center text-sm text-muted">
                    {project.summary}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {project.chips.map((chip) => (
                      <Badge key={chip} variant="outline">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </Surface>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-center sm:grid-cols-2">
                {quickDetails.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex h-20 flex-col items-center justify-between rounded-xl border border-border px-3 py-3"
                  >
                    <Kicker align="center">{detail.label}</Kicker>
                    <p className="text-base font-semibold text-text">
                      {detail.label === "Tier" ? (
                        <TierLabel tier={detail.value} />
                      ) : (
                        detail.value
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-center">
                <ToggleGroup
                  value={activeProof}
                  onValueChange={(val) => setActiveProof(val as ProofKey | "")}
                  options={proofOptions}
                  allowDeselect
                />
                {activeSection ? (
                  <div className="grid gap-3 text-sm text-text sm:grid-cols-2">
                    {(activeSection.items ?? []).map(
                      (item: { label: string; value: string }) => (
                        <div
                          key={item.label}
                          className="flex h-20 flex-col items-center justify-between rounded-xl border border-border px-3 py-2 text-center"
                        >
                          <Kicker
                            align="center"
                            className="min-h-6 leading-tight"
                          >
                            {item.label}
                          </Kicker>
                          <p className="min-h-5 text-sm font-semibold text-text">
                            {item.value}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry}
                  className="rounded-xl border border-border px-3 py-2 text-center text-sm text-text"
                >
                  {entry}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;

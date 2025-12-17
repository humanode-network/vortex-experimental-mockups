import { useState } from "react";
import { Link, useParams } from "react-router";
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
import { StatusPill } from "@/components/StatusPill";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { TierLabel } from "@/components/TierLabel";
import { ToggleGroup } from "@/components/ToggleGroup";
import {
  humanNodeProfile,
  proofToggleOptions,
  type ProofKey,
  type ProofSection,
} from "@/data/mock/humanNodeProfiles";

const HumanNode: React.FC = () => {
  const { id } = useParams();
  const [activeProof, setActiveProof] = useState<ProofKey | "">("");
  const {
    heroStats,
    quickDetails,
    proofSections,
    governanceActions,
    projects,
  } = humanNodeProfile;
  const name = id ?? "Unknown";
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
      <PageHint pageId="human-node" />
      <Surface
        as="section"
        variant="panel"
        radius="2xl"
        shadow="card"
        className="p-6"
      >
        <div className="grid items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex justify-center lg:justify-start">
            <AvatarPlaceholder
              initials={name.substring(0, 2).toUpperCase()}
              size="lg"
            />
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-semibold text-text">{name}</h1>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm lg:items-end">
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
          <Card key={stat.label} className="h-full text-center">
            <CardContent className="space-y-1 p-4 text-center">
              <Kicker align="center">
                {stat.label.startsWith("ACM") ? (
                  <HintLabel termId="acm">{stat.label}</HintLabel>
                ) : stat.label.startsWith("MM") ? (
                  <HintLabel termId="meritocratic_measure">
                    {stat.label}
                  </HintLabel>
                ) : (
                  stat.label
                )}
              </Kicker>
              <p className="text-2xl font-semibold text-text">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-center sm:grid-cols-2">
              {quickDetails.map((detail) => (
                <div
                  key={detail.label}
                  className="flex h-20 flex-col items-center justify-between rounded-xl border border-border px-3 py-3 text-center"
                >
                  <Kicker align="center">{detail.label}</Kicker>
                  <p className="text-center text-base font-semibold text-text">
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
                        <p className="text-base font-semibold">{item.value}</p>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Select PoT, PoD, or PoG to view metrics.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Governance summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            <p>
              JohnDoe currently leads several operator-focused squads and acts
              as a liaison for the Governance Council. Recent work focused on
              telemetry for biometric proofs, redundancy inside the mesh
              sequencer, and readiness drills for upcoming upgrades.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Governance activity</CardTitle>
              <Link
                to={`/human-nodes/${id ?? ""}/history`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                View full history
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          <CardContent className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.title}
                className="rounded-xl border border-border px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-text">
                    {project.title}
                  </p>
                  <Kicker>{project.status}</Kicker>
                </div>
                <p className="text-sm text-muted">{project.summary}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {project.chips.map((chip) => (
                    <Badge key={chip} variant="outline">
                      {chip}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HumanNode;

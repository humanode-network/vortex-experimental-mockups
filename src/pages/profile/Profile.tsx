import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { StatusPill } from "@/components/StatusPill";
import { AppPage } from "@/components/AppPage";

const heroStats = [
  { label: "ACM", value: "168" },
  { label: "MM", value: "81" },
  { label: "Invision score", value: "78 / 100" },
  { label: "Member since", value: "04.03.2020" },
];

const quickDetails = [
  {
    label: "Tier",
    value: <HintLabel termId="tier4_consul">Consul</HintLabel>,
  },
  { label: "Faction", value: "Anonymous" },
  { label: "Proposals created", value: "18" },
  { label: "Delegation share", value: "2.4%" },
];

type ProofSection = {
  title: string;
  items: { label: string; value: string }[];
};

type ProofKey = "time" | "devotion" | "governance";

const proofSections: Record<ProofKey, ProofSection> = {
  time: {
    title: "Proof-of-Time",
    items: [
      { label: "Human node for", value: "4 Y · 2 M" },
      { label: "Governor for", value: "3 Y · 4 M" },
    ],
  },
  devotion: {
    title: "Proof-of-Devotion",
    items: [
      { label: "Proposal accepted?", value: "Yes" },
      { label: "Participated in formation?", value: "Yes" },
    ],
  },
  governance: {
    title: "Proof-of-Governance",
    items: [
      { label: "Actively governed", value: "3 Y · 1 M" },
      { label: "Active governor?", value: "Yes" },
    ],
  },
};

const governanceActions = [
  {
    title: "Mesh redundancy QA",
    action: "Upvoted",
    context: "Formation Logistics",
    detail: "Supported final QA milestone with notes on redundant probes.",
  },
  {
    title: "Budget oversight motion",
    action: "Authored proposal",
    context: "Economics chamber",
    detail: "Outlined oversight cadence for mesh treasury replenishment.",
  },
  {
    title: "Protocol SSC drill",
    action: "Coordinated drill",
    context: "Protocol chamber",
    detail: "Ran simulated failover scenario during APAC shift.",
  },
  {
    title: "Telemetry SDK handoff",
    action: "Mentored team",
    context: "Faction task force",
    detail: "Gave onboarding session to task force maintainers.",
  },
  {
    title: "Guardian mentorship cohort",
    action: "Hosted sync",
    context: "Social Outreach",
    detail: "Facilitated feedback retro for mentors and mentees.",
  },
  {
    title: "Node health kit",
    action: "Reviewed implementation",
    context: "Formation",
    detail: "Approved automation scripts for validator health checks.",
  },
  {
    title: "Liveness sentinel retrofit",
    action: "Casted vote",
    context: "Security chamber",
    detail:
      "Logged concerns about roll-out pacing but still backed the upgrade.",
  },
  {
    title: "Formation guild ops",
    action: "Opened proposal",
    context: "Formation Council",
    detail: "Requested budget for guild-specific ops tooling.",
  },
  {
    title: "Mesh telemetry board",
    action: "Filed bug",
    context: "Formation logistics",
    detail: "Documented slow query causing alert lag.",
  },
  {
    title: "Governor onboarding brief",
    action: "Led workshop",
    context: "Protocol chamber",
    detail: "Shared best practices for new mesh governors.",
  },
];

const projects = [
  {
    title: "Node Health Kit",
    status: "Formation Logistics · Live",
    summary:
      "Automation bundle for validator diagnostics and recovery workflows.",
    chips: ["Budget: 80k HMND", "Milestones: 6 / 9", "Team slots: 2 open"],
  },
  {
    title: "Identity Risk Lab",
    status: "Research · Upcoming",
    summary: "Threat modeling track focused on biometric verification attacks.",
    chips: ["Budget: 45k HMND", "Milestones: 0 / 5", "Team slots: 3 open"],
  },
  {
    title: "Mesh Telemetry Board",
    status: "Formation Logistics · Live",
    summary: "Visualization board for mesh telemetry anomalies and lag spikes.",
    chips: ["Budget: 52k HMND", "Milestones: 3 / 5", "Team slots: 1 open"],
  },
  {
    title: "Guardian Mentorship",
    status: "Social Impact · Live",
    summary: "Mentorship rotation pairing experienced governors with nominees.",
    chips: ["Budget: 36k HMND", "Milestones: 4 / 6", "Team slots: 0 open"],
  },
];

const history = [
  "Epoch 214 · Proposed mesh redundancy telemetry board",
  "Epoch 209 · Presented budget oversight motion",
  "Epoch 205 · Led guardian mentorship sync",
];

const proofToggleOptions: { key: ProofKey; label: string }[] = [
  { key: "time", label: "PoT" },
  { key: "devotion", label: "PoD" },
  { key: "governance", label: "PoG" },
];

const Profile: React.FC = () => {
  const [activeProof, setActiveProof] = useState<ProofKey | "">("");
  const name = "JohnDoe";
  const governorActive = true;
  const humanNodeActive = true;
  const activeSection: ProofSection | null = activeProof
    ? proofSections[activeProof]
    : null;

  return (
    <AppPage pageId="profile">
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
            <p className="text-xs tracking-wide text-muted uppercase">
              My profile
            </p>
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
              <p className="text-xs tracking-wide text-muted uppercase">
                {stat.label === "ACM" ? (
                  <HintLabel termId="acm" termText="ACM" />
                ) : stat.label === "MM" ? (
                  <HintLabel termId="meritocratic_measure" termText="MM" />
                ) : (
                  stat.label
                )}
              </p>
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
                      <p className="line-clamp-1 text-xs tracking-wide text-primary uppercase">
                        {action.action}
                      </p>
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
                    <p className="text-xs tracking-wide text-muted uppercase">
                      {project.status}
                    </p>
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
                    <p className="text-xs tracking-wide text-muted uppercase">
                      {detail.label}
                    </p>
                    <p className="text-base font-semibold text-text">
                      {detail.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-center">
                <div className="inline-flex rounded-full border border-border bg-panel p-1">
                  {proofToggleOptions.map((option) => {
                    const isActive = activeProof === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          setActiveProof((prev) =>
                            prev === option.key ? "" : option.key,
                          )
                        }
                        className={[
                          "min-w-20 rounded-full px-3 py-1.5 text-sm font-semibold transition",
                          isActive
                            ? "bg-primary text-[var(--primary-foreground)] shadow-[var(--shadow-tile)]"
                            : "bg-transparent text-text hover:bg-panel-alt",
                        ].join(" ")}
                      >
                        {option.label === "PoT" ? (
                          <HintLabel termId="proof_of_time_pot">
                            {option.label}
                          </HintLabel>
                        ) : option.label === "PoD" ? (
                          <HintLabel termId="proof_of_devotion_pod">
                            {option.label}
                          </HintLabel>
                        ) : option.label === "PoG" ? (
                          <HintLabel termId="proof_of_governance_pog">
                            {option.label}
                          </HintLabel>
                        ) : (
                          option.label
                        )}
                      </button>
                    );
                  })}
                </div>
                {activeSection ? (
                  <div className="grid gap-3 text-sm text-text sm:grid-cols-2">
                    {(activeSection.items ?? []).map(
                      (item: { label: string; value: string }) => (
                        <div
                          key={item.label}
                          className="flex h-20 flex-col items-center justify-between rounded-xl border border-border px-3 py-2 text-center"
                        >
                          <p className="min-h-6 text-xs leading-tight tracking-wide text-muted uppercase">
                            {item.label}
                          </p>
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
    </AppPage>
  );
};

export default Profile;

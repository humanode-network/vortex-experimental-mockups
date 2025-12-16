import { useState } from "react";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { AvatarPlaceholder } from "@/components/AvatarPlaceholder";
import { StatusPill } from "@/components/StatusPill";
import { AppPage } from "@/components/AppPage";

const heroStats = [
  { label: "ACM", value: "182" },
  { label: "MM", value: "92" },
  { label: "Invision score", value: "82 / 100" },
  { label: "Member since", value: "11.06.2021" },
];

const quickDetails = [
  {
    label: "Tier",
    value: <HintLabel termId="tier3_legate">Legate</HintLabel>,
  },
  { label: "Faction", value: "Anonymous" },
  { label: "Delegation share", value: "113 · 3.4%" },
  { label: "Proposals created", value: "28" },
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
      { label: "Human node for", value: "3 Y · 4 M" },
      { label: "Governor for", value: "2 Y · 2 M" },
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
      { label: "Actively governed", value: "2 Y · 1 M" },
      { label: "Active governor?", value: "Yes" },
    ],
  },
};

const governanceActions = [
  {
    title: "Reddit brand proposal",
    action: "Upvoted",
    context: "Marketing proposal pool",
    detail:
      "Flagged key talking points for community roll-out and nudged pool momentum.",
  },
  {
    title: "Update runtime proposal",
    action: "Casted vote",
    context: "Protocol chamber",
    detail: "Left implementation notes on validator staggered restarts.",
  },
  {
    title: "The Smurf project",
    action: "Left project",
    context: "Formation",
    detail: "Transitioned responsibilities to Nana after hand-off retro.",
  },
  {
    title: "Fee telemetry upgrade #225",
    action: "Authored proposal",
    context: "Protocol chamber",
    detail: "Outlined dual-path telemetry for biometric proofs and mesh fees.",
  },
  {
    title: "Treasury split adjustment #883",
    action: "Presented motion",
    context: "Economic chamber",
    detail: "Arbitrated between Formation and Treasury subcommittees.",
  },
  {
    title: "Protocol SSC quorum drill",
    action: "Coordinated drill",
    context: "Protocol chamber",
    detail: "Simulated night shift quorum loss and documented timings.",
  },
  {
    title: "Mesh sequencer redundancy",
    action: "Reviewed implementation",
    context: "Formation",
    detail:
      "Signed off on milestone 3 safety checklist for redundant sequencers.",
  },
  {
    title: "Budget oversight motion",
    action: "Co-authored memo",
    context: "Governance proposal pool",
    detail: "Drafted memo summarizing risk thresholds for fiscal year.",
  },
  {
    title: "Telemetry SDK handoff",
    action: "Mentored team",
    context: "Faction task force",
    detail: "Recorded screencasts for SDK setup and alert configuration.",
  },
  {
    title: "Chamber audit sync",
    action: "Hosted session",
    context: "Security chamber",
    detail: "Walked through previous incidents and matched to audit trails.",
  },
  {
    title: "Formation handover 12",
    action: "Signed off",
    context: "Formation",
    detail: "Validated milestone artifacts and updated ops board.",
  },
  {
    title: "Governor onboarding brief",
    action: "Led workshop",
    context: "Protocol chamber",
    detail: "Gave quickstart checklist for new governors joining mesh topics.",
  },
  {
    title: "Network health retro",
    action: "Published report",
    context: "Protocol council",
    detail: "Shared dashboard snapshots and postmortem experiments.",
  },
  {
    title: "Mesh redundancy QA",
    action: "Completed review",
    context: "Formation logistics",
    detail: "Filed follow-ups for two flaky sensors before sign-off.",
  },
  {
    title: "Deterrence sim drill",
    action: "Activated standby",
    context: "Security & infra",
    detail: "Ran pager playbook and escalated to infra for acknowledgement.",
  },
];

const projects = [
  {
    title: "Node Health Kit",
    status: "Formation Logistics · Live",
    summary:
      "Automation bundle for validator diagnostics, recovery, and escalation workflows for operators.",
    chips: ["Budget: 80k HMND", "Milestones: 6 / 9", "Team slots: 2 open"],
  },
  {
    title: "Identity Risk Lab",
    status: "Research · Upcoming",
    summary:
      "Threat modeling track focused on biometric verification attacks and countermeasures.",
    chips: ["Budget: 45k HMND", "Milestones: 0 / 5", "Team slots: 3 open"],
  },
  {
    title: "Mesh Telemetry Board",
    status: "Formation Logistics · Live",
    summary:
      "Realtime visualization board for mesh telemetry anomalies and biometric lag spikes.",
    chips: ["Budget: 52k HMND", "Milestones: 3 / 5", "Team slots: 1 open"],
  },
  {
    title: "Guardian Mentorship Cohort",
    status: "Social Impact · Live",
    summary:
      "Mentorship rotation pairing experienced governors with nominating cohort.",
    chips: ["Budget: 36k HMND", "Milestones: 4 / 6", "Team slots: 0 open"],
  },
  {
    title: "Formation Guild Ops Stack",
    status: "Formation Logistics · Upcoming",
    summary:
      "Comprehensive ops, payroll, and reporting stack for Formation guild leads.",
    chips: ["Budget: 90k HMND", "Milestones: 1 / 8", "Team slots: 4 open"],
  },
  {
    title: "Governor Sync Relay",
    status: "Research · Completed",
    summary:
      "Async sync relay specifications for cross-faction governor collaboration.",
    chips: ["Budget: 28k HMND", "Milestones: 5 / 5", "Team slots: 0 open"],
  },
];

const proofToggleOptions: { key: ProofKey; label: string }[] = [
  { key: "time", label: "PoT" },
  { key: "devotion", label: "PoD" },
  { key: "governance", label: "PoG" },
];

const HumanNode: React.FC = () => {
  const { id } = useParams();
  const [activeProof, setActiveProof] = useState<ProofKey | "">("");
  const name = id ?? "Unknown";
  const governorActive = true;
  const humanNodeActive = true;
  const activeSection: ProofSection | null = activeProof
    ? proofSections[activeProof]
    : null;

  return (
    <AppPage pageId="human-node">
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
              <p className="text-xs tracking-wide text-muted uppercase">
                {stat.label.startsWith("ACM") ? (
                  <HintLabel termId="acm">{stat.label}</HintLabel>
                ) : stat.label.startsWith("MM") ? (
                  <HintLabel termId="meritocratic_measure">
                    {stat.label}
                  </HintLabel>
                ) : (
                  stat.label
                )}
              </p>
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
                  <p className="text-center text-xs tracking-wide text-muted uppercase">
                    {detail.label}
                  </p>
                  <p className="text-center text-base font-semibold text-text">
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
                        <p className="min-h-6 text-center text-xs leading-tight tracking-wide text-muted uppercase">
                          {item.label}
                        </p>
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
                  <p className="text-xs tracking-wide text-muted uppercase">
                    {project.status}
                  </p>
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
    </AppPage>
  );
};

export default HumanNode;

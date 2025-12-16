import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HintLabel } from "@/components/Hint";
import { AppPage } from "@/components/AppPage";
import { ExpandableCard } from "@/components/ExpandableCard";
import { StageDataTile } from "@/components/StageDataTile";
import { DashedStatItem } from "@/components/DashedStatItem";

type Stage = "pool" | "vote" | "build" | "thread" | "courts" | "faction";

type FeedItem = {
  id: string;
  title: string;
  meta: string;
  stage: Stage;
  stageLabel: string;
  summaryPill: string;
  summary: ReactNode;
  stageData?: {
    title: string;
    description: string;
    value: ReactNode;
    tone?: "ok" | "warn";
  }[];
  stats?: { label: string; value: ReactNode }[];
  proposer?: string;
  proposerId?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  href?: string;
  timestamp: string; // ISO string
};

const stageStyles: Record<Stage, string> = {
  pool: "bg-[color:var(--accent-warm)]/15 text-[var(--accent-warm)]",
  vote: "bg-[color:var(--accent)]/15 text-[var(--accent)]",
  build: "bg-[color:var(--primary)]/12 text-primary",
  thread: "bg-[var(--tint-primary)] text-primary",
  courts: "bg-[color:var(--destructive)]/15 text-[var(--destructive)]",
  faction: "bg-panel-alt text-text",
};

const feedItems: FeedItem[] = [
  {
    id: "adaptive-fee",
    title: "Adaptive Fee Shaping",
    meta: "Economics & Treasury · Consul",
    stage: "vote",
    stageLabel: "Chamber vote",
    summaryPill: "Economics chamber",
    summary:
      "Dynamic fee split feeding Formation, treasury, and biometrics based on stress.",
    stageData: [
      {
        title: "Voting quorum",
        description: "Strict 33% active governors",
        value: "Met · 34%",
        tone: "ok",
      },
      {
        title: "Passing rule",
        description: "≥66.6% + 1 vote yes",
        value: "Current 57%",
        tone: "warn",
      },
      { title: "Time left", description: "Voting window", value: "05h 15m" },
    ],
    stats: [
      { label: "Formation impact", value: "Medium" },
      { label: "Votes casted", value: "34" },
    ],
    proposer: "Victor",
    proposerId: "Victor",
    ctaPrimary: "Open proposal",
    ctaSecondary: "Add to agenda",
    href: "/proposals/adaptive-fee/chamber",
    timestamp: "2025-02-15T12:10:00Z",
  },
  {
    id: "sequencer-upgrade",
    title: "Sequencer Redundancy Rollout",
    meta: "Protocol Engineering · Legate",
    stage: "pool",
    stageLabel: "Proposal pool",
    summaryPill: "Protocol chamber",
    summary:
      "Redundant biometric sequencers with cross-epoch checkpoints to cut failover time.",
    stageData: [
      {
        title: "Pool momentum",
        description: "Upvotes / Downvotes",
        value: "24 / 6",
      },
      {
        title: "Attention quorum",
        description: "20% active or ≥10% upvotes",
        value: "Met · 30%",
        tone: "ok",
      },
      { title: "Votes casted", description: "Backing seats", value: "24" },
    ],
    stats: [{ label: "Budget ask", value: "210k HMND" }],
    proposer: "John Doe",
    proposerId: "john-doe",
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
    href: "/proposals/sequencer-upgrade/pp",
    timestamp: "2024-02-01T09:00:00Z",
  },
  {
    id: "liveness-sentinel",
    title: "Liveness Sentinel Retrofit",
    meta: "Security · Legate",
    stage: "vote",
    stageLabel: "Chamber vote",
    summaryPill: "Security chamber",
    summary:
      "Retrofit sentinel nodes with liveness circuit breaker to prevent cascading outages.",
    stageData: [
      {
        title: "Voting quorum",
        description: "Strict 33% active governors",
        value: "Pending · 28%",
        tone: "warn",
      },
      {
        title: "Passing rule",
        description: "≥66.6% + 1 vote yes",
        value: "Current 62%",
      },
      { title: "Time left", description: "Voting window", value: "05h 42m" },
    ],
    stats: [
      { label: "Equipment budget", value: "60k HMND" },
      { label: "Rollout scope", value: "42 sentinel nodes" },
    ],
    proposer: "Shannon",
    proposerId: "Shannon",
    ctaPrimary: "Open proposal",
    ctaSecondary: "Track vote",
    href: "/proposals/liveness-sentinel/chamber",
    timestamp: "2024-11-20T07:30:00Z",
  },
  {
    id: "deterrence-sim-lab",
    title: "Deterrence Sim Lab",
    meta: "Formation · Research",
    stage: "build",
    stageLabel: "Formation",
    summaryPill: "Milestone 2 / 3",
    summary:
      "Simulation track for deterrence scenarios; SRE/QA/Writer slots open.",
    stageData: [
      { title: "Budget allocated", description: "HMND", value: "180k" },
      { title: "Team slots", description: "Taken / Total", value: "3 / 6" },
      {
        title: "Deployment progress",
        description: "Reported completion",
        value: "68%",
      },
    ],
    stats: [
      { label: "Lead chamber", value: "Research" },
      { label: "Next check-in", value: "Epoch 186" },
    ],
    proposer: "Research Lab",
    proposerId: "john-doe",
    ctaPrimary: "View milestone",
    ctaSecondary: "Ping team",
    href: "/formation",
    timestamp: "2025-03-15T18:00:00Z",
  },
  {
    id: "delegation-dispute",
    title: "Courts: Delegation Dispute #44",
    meta: "Courts · Jury · Awaiting statement",
    stage: "courts",
    stageLabel: "Courts",
    summaryPill: "Jury",
    summary: "Delegation dispute filed; statement requested before review.",
    stats: [
      { label: "Status", value: "Awaiting statement" },
      { label: "ETA", value: "Review in 1d" },
    ],
    ctaPrimary: "Open appeal",
    ctaSecondary: "Track",
    href: "/courts",
    timestamp: "2025-04-02T06:45:00Z",
  },
  {
    id: "protocol-council-thread",
    title: "Protocol Council Thread",
    meta: "Protocol chamber · Thread",
    stage: "thread",
    stageLabel: "Thread",
    summaryPill: "Protocol chamber",
    summary: "Incident review for redundant checkpoints · new replies.",
    ctaPrimary: "Open thread",
    ctaSecondary: "Mark read",
    href: "/chambers/protocol-engineering",
    timestamp: "2025-03-30T05:10:00Z",
  },
  {
    id: "protocol-keepers-thread",
    title: "Protocol Keepers Thread",
    meta: "Faction · Protocol Keepers",
    stage: "thread",
    stageLabel: "Thread",
    summaryPill: "Faction thread",
    summary: "Privacy sprint planning · new replies.",
    ctaPrimary: "Open thread",
    ctaSecondary: "Mark read",
    href: "/factions/protocol-keepers",
    timestamp: "2025-03-26T04:00:00Z",
  },
  {
    id: "formation-guild",
    title: "Formation Guild Update",
    meta: "Faction · Formation Guild",
    stage: "faction",
    stageLabel: "Faction",
    summaryPill: "Slots open",
    summary: (
      <span>
        Votes: 18 · <HintLabel termId="acm">ACM</HintLabel>: 1,500 · Ops slots
        open for guild initiatives.
      </span>
    ),
    ctaPrimary: "Open faction",
    ctaSecondary: "Follow",
    href: "/factions/formation-guild",
    timestamp: "2025-03-20T20:00:00Z",
  },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day}/${month}/${year} · ${time}`;
};

const Feed: React.FC = () => {
  const sortedFeed = [...feedItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((curr) => (curr === id ? null : id));
  };

  return (
    <AppPage pageId="feed" variant="stack4">
      {/* Governing threshold moved to MyGovernance */}

      <section aria-live="polite" className="flex flex-col gap-4">
        {sortedFeed.map((item, index) => (
          <ExpandableCard
            key={item.id}
            expanded={expanded === item.id}
            onToggle={() => toggle(item.id)}
            className={cn(index < 3 ? "border-primary" : "border-border")}
            meta={formatDate(item.timestamp)}
            title={item.title}
            right={
              <>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                    stageStyles[item.stage],
                  )}
                >
                  {item.stageLabel === "Chamber vote" ? (
                    <HintLabel termId="chamber_vote">
                      {item.stageLabel}
                    </HintLabel>
                  ) : item.stageLabel === "Formation" ? (
                    <HintLabel termId="formation">{item.stageLabel}</HintLabel>
                  ) : (
                    item.stageLabel
                  )}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {item.summaryPill}
                </Badge>
              </>
            }
          >
            <p className="text-sm text-muted">{item.summary}</p>

            {item.stageData ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {item.stageData.map((entry) => (
                  <StageDataTile
                    key={entry.title}
                    title={entry.title}
                    description={entry.description}
                    value={entry.value}
                    tone={entry.tone}
                  />
                ))}
              </div>
            ) : null}

            {item.stats ? (
              <ul className="grid gap-2 text-sm text-text md:grid-cols-2">
                {item.stats.map((stat) => (
                  <DashedStatItem
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                  />
                ))}
              </ul>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {item.proposer && item.proposerId ? (
                <Link
                  to={`/human-nodes/${item.proposerId}`}
                  className="text-sm font-semibold text-primary"
                >
                  Proposer: {item.proposer}
                </Link>
              ) : (
                <span className="text-sm text-muted"> </span>
              )}
              <div className="flex flex-wrap gap-2">
                {item.href && item.ctaPrimary ? (
                  <Button asChild size="sm">
                    <Link to={item.href}>{item.ctaPrimary}</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </ExpandableCard>
        ))}
      </section>
    </AppPage>
  );
};

export default Feed;

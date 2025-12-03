import { useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Stage = "pool" | "vote" | "build" | "thread" | "courts" | "faction";

type FeedItem = {
  id: string;
  title: string;
  meta: string;
  stage: Stage;
  stageLabel: string;
  summaryPill: string;
  summary: string;
  stageData?: {
    title: string;
    description: string;
    value: string;
    tone?: "ok" | "warn";
  }[];
  stats?: { label: string; value: string }[];
  proposer?: string;
  proposerId?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  href?: string;
  timestamp: string; // ISO string
};

const stageStyles: Record<Stage, string> = {
  pool: "bg-amber-100 text-amber-800",
  vote: "bg-emerald-100 text-emerald-800",
  build: "bg-blue-100 text-blue-800",
  thread: "bg-purple-100 text-purple-800",
  courts: "bg-red-100 text-red-800",
  faction: "bg-slate-100 text-slate-800",
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
    stats: [
      { label: "Proof mix", value: "PoT 45% · PoD 35% · PoG 20%" },
      { label: "Budget ask", value: "210k HMND" },
    ],
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
    summary: "Votes: 18 · ACM: 1,500 · Ops slots open for guild initiatives.",
    ctaPrimary: "Open faction",
    ctaSecondary: "Follow",
    href: "/factions/formation-guild",
    timestamp: "2025-03-20T20:00:00Z",
  },
];

const eraActivity = {
  era: "Era 142",
  thresholdLabel: "Required actions",
  required: 18,
  completed: 11,
  actions: [
    { label: "Pool votes", done: 5, required: 6 },
    { label: "Chamber votes", done: 3, required: 6 },
    { label: "Court actions", done: 1, required: 3 },
    { label: "Proposals", done: 2, required: 3 },
  ],
};

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
    <div className="app-page flex flex-col gap-4">
      {/* Governing threshold moved to MyGovernance */}

      <section aria-live="polite" className="flex flex-col gap-4">
        {sortedFeed.map((item, index) => (
          <Card
            key={item.id}
            className={cn(
              "bg-panel overflow-hidden border",
              index < 3 ? "border-primary" : "border-border",
            )}
          >
            <button
              type="button"
              className="hover:bg-panel-alt flex w-full flex-col gap-4 px-5 py-4 text-left transition sm:flex-row sm:items-center sm:justify-between"
              aria-expanded={expanded === item.id}
              onClick={() => toggle(item.id)}
            >
              <div className="space-y-1">
                <p className="text-xs tracking-wide text-muted uppercase">
                  {formatDate(item.timestamp)}
                </p>
                <p className="text-lg font-semibold text-(--text)">
                  {item.title}
                </p>
              </div>
              <div className="flex flex-col gap-2 text-right sm:flex-row sm:items-center sm:gap-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                    stageStyles[item.stage],
                  )}
                >
                  {item.stageLabel}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {item.summaryPill}
                </Badge>
                <span
                  className={cn(
                    "ml-auto h-5 w-5 text-muted transition-transform sm:ml-0",
                    expanded === item.id && "rotate-180",
                  )}
                >
                  ▼
                </span>
              </div>
            </button>

            {expanded === item.id && (
              <div className="border-top space-y-5 border-t border-border px-5 py-5">
                <p className="text-sm text-muted">{item.summary}</p>

                {item.stageData && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {item.stageData.map((entry) => (
                      <div
                        key={entry.title}
                        className="bg-panel-alt rounded-xl border border-border p-4"
                      >
                        <p className="text-sm font-semibold text-muted">
                          {entry.title}
                        </p>
                        <p className="text-xs text-muted">
                          {entry.description}
                        </p>
                        <p
                          className={cn(
                            "text-lg font-semibold text-(--text)",
                            entry.tone === "ok" && "text-emerald-500",
                            entry.tone === "warn" && "text-amber-500",
                          )}
                        >
                          {entry.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {item.stats && (
                  <ul className="grid gap-2 text-sm text-(--text) md:grid-cols-2">
                    {item.stats.map((stat) => (
                      <li
                        key={stat.label}
                        className="bg-panel-alt rounded-xl border border-dashed border-border/70 px-4 py-3"
                      >
                        <span className="font-semibold">{stat.label}:</span>{" "}
                        {stat.value}
                      </li>
                    ))}
                  </ul>
                )}

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
                    {item.href && item.ctaPrimary && (
                      <Button asChild size="sm">
                        <Link to={item.href}>{item.ctaPrimary}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </section>
    </div>
  );
};

export default Feed;

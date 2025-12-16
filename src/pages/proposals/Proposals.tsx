import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { HintLabel } from "@/components/Hint";
import { SearchBar } from "@/components/SearchBar";
import { AppPage } from "@/components/AppPage";
import { ExpandableCard } from "@/components/ExpandableCard";
import { StageDataTile } from "@/components/StageDataTile";
import { DashedStatItem } from "@/components/DashedStatItem";

type Stage = "pool" | "vote" | "build" | "final" | "archived";
type ProofWeight = "pot" | "pod" | "pog";

type StageDatum = {
  title: string;
  description: string;
  value: ReactNode;
  tone?: "ok" | "warn";
};

type ProposalStat = {
  label: string;
  value: ReactNode;
};

type Proposal = {
  id: string;
  title: string;
  meta: string;
  stage: Stage;
  stageLabel: string;
  summaryPill: string;
  summary: string;
  stageData: StageDatum[];
  stats: ProposalStat[];
  proposer: string;
  proposerId: string;
  chamber: string;
  tier: "Nominee" | "Tribune" | "Legate" | "Consul" | "Citizen";
  proofFocus: ProofWeight;
  tags: string[];
  keywords: string[];
  date: string;
  votes: number;
  activityScore: number;
  ctaPrimary: string;
  ctaSecondary: string;
};

const proposalData: Proposal[] = [
  {
    id: "orbital-mesh",
    title: "Orbital Mesh Sequencer Upgrade",
    meta: "Protocol Engineering · Legate tier",
    stage: "pool",
    stageLabel: "Proposal pool",
    summaryPill: "Protocol Engineering chamber",
    summary:
      "Introduce redundant biometric sequencer nodes to lower latency in the verification flow and enable inter-era checkpoints.",
    stageData: [
      {
        title: "Pool momentum",
        description: "Upvotes / Downvotes",
        value: "24 / 6",
      },
      {
        title: "Attention quorum",
        description: "20% active or ≥10% upvotes",
        value: "Met · 30% engaged",
        tone: "ok",
      },
      { title: "Votes casted", description: "Backing seats", value: "24" },
    ],
    stats: [
      { label: "Budget ask", value: "210k HMND" },
      { label: "Formation impact", value: "High" },
    ],
    proposer: "JohnDoe",
    proposerId: "JohnDoe",
    chamber: "Protocol Engineering",
    tier: "Legate",
    proofFocus: "pot",
    tags: ["Infrastructure", "Security", "High quorum"],
    keywords: [
      "orbital",
      "mesh",
      "seq",
      "upgrade",
      "protocol",
      "engineering",
      "legate",
      "redundancy",
      "latency",
    ],
    date: "2024-04-18",
    votes: 28,
    activityScore: 82,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "adaptive-fee",
    title: "Adaptive Fee Shaping",
    meta: "Economics & Treasury · Consul",
    stage: "vote",
    stageLabel: "Chamber vote",
    summaryPill: "Economics chamber",
    summary:
      "Dynamic fee split that feeds Formation, treasury, and biometric maintenance based on network stress and quorum activity.",
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
      { title: "Time left", description: "Voting window", value: "02h 15m" },
    ],
    stats: [{ label: "Votes casted", value: "34" }],
    proposer: "Victor",
    proposerId: "Victor",
    chamber: "Economics & Treasury",
    tier: "Consul",
    proofFocus: "pod",
    tags: ["Formation", "Community", "High quorum"],
    keywords: [
      "adaptive",
      "fee",
      "treasury",
      "economics",
      "consul",
      "formation",
    ],
    date: "2024-04-16",
    votes: 51,
    activityScore: 90,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Add to agenda",
  },
  {
    id: "sybilguard-mirror",
    title: "SybilGuard L2 Mirror",
    meta: "Security & Infra · Legate",
    stage: "build",
    stageLabel: "Formation",
    summaryPill: "Milestone 2 / 4",
    summary:
      "Mirror anti-Sybil heuristics onto an auxiliary rollup so partner DAOs can consume attestations via trust minimised bridges.",
    stageData: [
      { title: "Budget allocated", description: "HMND", value: "420k" },
      { title: "Team slots", description: "Taken / Total", value: "7 / 9" },
      {
        title: "Deployment progress",
        description: "Reported completion",
        value: "68%",
      },
    ],
    stats: [
      { label: "Lead chamber", value: "Security & Infra" },
      { label: "Next check-in", value: "Epoch 186" },
    ],
    proposer: "Sesh",
    proposerId: "Sesh",
    chamber: "Security & Infra",
    tier: "Legate",
    proofFocus: "pog",
    tags: ["Security", "Research", "Infrastructure"],
    keywords: [
      "sybilguard",
      "mirror",
      "security",
      "legate",
      "formation",
      "rollup",
    ],
    date: "2024-04-12",
    votes: 9,
    activityScore: 74,
    ctaPrimary: "View milestone",
    ctaSecondary: "Ping team",
  },
  {
    id: "mesh-talent",
    title: "Mesh Talent Onboarding Fund",
    meta: "Formation Guild · Tribune tier",
    stage: "pool",
    stageLabel: "Proposal pool",
    summaryPill: "Formation committee",
    summary:
      "Create a rolling grant for onboarding biometric researchers and UX engineers into the Mesh program with rapid stipends.",
    stageData: [
      {
        title: "Pool momentum",
        description: "Upvotes / Downvotes",
        value: "74 / 5",
      },
      {
        title: "Attention quorum",
        description: "20% active or ≥10% upvotes",
        value: "In progress · 18%",
      },
      { title: "Votes casted", description: "Backing seats", value: "19" },
    ],
    stats: [
      { label: "Requested budget", value: "95k HMND" },
      { label: "Impact area", value: "Talent & education" },
    ],
    proposer: "Tony",
    proposerId: "Tony",
    chamber: "Social Impact",
    tier: "Tribune",
    proofFocus: "pod",
    tags: ["Formation", "Community"],
    keywords: ["mesh", "talent", "formation", "tribune", "education"],
    date: "2024-04-10",
    votes: 19,
    activityScore: 68,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Watch",
  },
  {
    id: "liveness-sentinel",
    title: "Liveness Sentinel Retrofit",
    meta: "Security · Legate",
    stage: "vote",
    stageLabel: "Chamber vote",
    summaryPill: "Security chamber",
    summary:
      "Retrofit legacy sentinel nodes with the new liveness circuit breaker to prevent cascading biometric outages across shards.",
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
    stats: [{ label: "Equipment budget", value: "60k HMND" }],
    proposer: "Shannon",
    proposerId: "Shannon",
    chamber: "Security & Infra",
    tier: "Legate",
    proofFocus: "pog",
    tags: ["Security", "Infrastructure", "High quorum"],
    keywords: ["liveness", "sentinel", "security", "vote"],
    date: "2024-04-08",
    votes: 33,
    activityScore: 71,
    ctaPrimary: "Open proposal",
    ctaSecondary: "Track vote",
  },
  {
    id: "delegation-ledger",
    title: "Delegation Transparency Ledger",
    meta: "Constitutional · Citizen",
    stage: "archived",
    stageLabel: "Archived",
    summaryPill: "Cycle 407",
    summary:
      "Immutable public feed of delegation shifts and vote reroutes with zk-SNARK concealed identities for observers.",
    stageData: [
      {
        title: "Chamber verdict",
        description: "Constitutional quorum 33%",
        value: "Refused",
        tone: "warn",
      },
      {
        title: "Reapply conditions",
        description: "Needed proof",
        value: "New privacy circuit",
      },
      { title: "Cycle", description: "Historic reference", value: "407" },
    ],
    stats: [
      { label: "Rejection reason", value: "Privacy load unresolved" },
      { label: "Author tier", value: "Citizen" },
    ],
    proposer: "Sasha",
    proposerId: "Sasha",
    chamber: "Constitutional",
    tier: "Citizen",
    proofFocus: "pot",
    tags: ["Research", "Infrastructure"],
    keywords: [
      "delegation",
      "transparency",
      "ledger",
      "constitutional",
      "refused",
    ],
    date: "2023-11-18",
    votes: 12,
    activityScore: 34,
    ctaPrimary: "Open proposal",
    ctaSecondary: "View audit notes",
  },
];

const stageStyles: Record<Stage, string> = {
  pool: "border border-[var(--primary-dim)] bg-[var(--tint-primary)] text-primary",
  vote: "border border-[var(--cool-dim)] bg-[color:var(--accent)]/10 text-[var(--accent)]",
  build:
    "border border-[var(--warm-dim)] bg-[color:var(--accent-warm)]/10 text-[var(--accent-warm)]",
  final: "border border-border bg-panel-alt text-text",
  archived: "border border-border bg-panel-alt text-muted",
};

const Proposals: React.FC = () => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<Stage | "any">("any");
  const [chamberFilter, setChamberFilter] = useState("All chambers");
  const [sortBy, setSortBy] = useState<
    "Newest" | "Oldest" | "Activity" | "Votes"
  >("Newest");

  const filteredProposals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return proposalData
      .filter((proposal) => {
        const matchesTerm = term
          ? proposal.title.toLowerCase().includes(term) ||
            proposal.summary.toLowerCase().includes(term) ||
            proposal.meta.toLowerCase().includes(term) ||
            proposal.keywords.some((keyword) =>
              keyword.toLowerCase().includes(term),
            )
          : true;
        const matchesStage =
          stageFilter === "any" ? true : proposal.stage === stageFilter;
        const matchesChamber =
          chamberFilter === "All chambers"
            ? true
            : proposal.chamber === chamberFilter;
        return matchesTerm && matchesStage && matchesChamber;
      })
      .sort((a, b) => {
        if (sortBy === "Newest") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === "Oldest") {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === "Activity") {
          return b.activityScore - a.activityScore;
        }
        if (sortBy === "Votes") {
          return b.votes - a.votes;
        }
        return 0;
      });
  }, [search, stageFilter, chamberFilter, sortBy]);

  const filtersContent = (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs tracking-wide text-muted uppercase">Status</p>
        <Select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as Stage | "any")}
        >
          <option value="any">Any</option>
          <option value="pool">Proposal pool</option>
          <option value="vote">Chamber vote</option>
          <option value="build">Formation</option>
          <option value="final">Final vote</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      <div className="space-y-1">
        <p className="text-xs tracking-wide text-muted uppercase">Chamber</p>
        <Select
          value={chamberFilter}
          onChange={(e) => setChamberFilter(e.target.value)}
        >
          <option value="All chambers">All chambers</option>
          <option value="Protocol Engineering">Protocol Engineering</option>
          <option value="Economics & Treasury">Economics & Treasury</option>
          <option value="Security & Infra">Security & Infra</option>
          <option value="Constitutional">Constitutional</option>
          <option value="Social Impact">Social Impact</option>
        </Select>
      </div>
      <div className="space-y-1">
        <p className="text-xs tracking-wide text-muted uppercase">Sort by</p>
        <Select
          value={sortBy}
          onChange={(e) =>
            setSortBy(
              e.target.value as "Newest" | "Oldest" | "Activity" | "Votes",
            )
          }
        >
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
          <option value="Activity">Activity</option>
          <option value="Votes">Votes casted</option>
        </Select>
      </div>
    </div>
  );

  const toggleProposal = (id: string) => {
    setExpanded((current) => (current === id ? null : id));
  };

  return (
    <AppPage pageId="proposals">
      <div className="flex justify-between gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="rounded-full px-4"
        >
          <Link to="/proposals/drafts">Drafts</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/proposals/new">Create proposal</Link>
          </Button>
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search proposals by title, hash, proposer…"
        ariaLabel="Search proposals"
        filtersContent={filtersContent}
      />

      <section aria-live="polite" className="flex flex-col gap-4">
        {filteredProposals.length === 0 && (
          <Card className="border border-dashed border-border bg-panel px-5 py-6 text-center text-sm text-muted">
            No proposals match the current search.
          </Card>
        )}

        {filteredProposals.map((proposal) => (
          <ExpandableCard
            key={proposal.id}
            expanded={expanded === proposal.id}
            onToggle={() => toggleProposal(proposal.id)}
            meta={proposal.meta}
            title={proposal.title}
            right={
              <>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                    stageStyles[proposal.stage],
                  )}
                >
                  {proposal.stageLabel === "Proposal pool" ? (
                    <HintLabel termId="proposal_pools">
                      {proposal.stageLabel}
                    </HintLabel>
                  ) : proposal.stageLabel === "Chamber vote" ? (
                    <HintLabel termId="chamber_vote">
                      {proposal.stageLabel}
                    </HintLabel>
                  ) : proposal.stageLabel === "Formation" ? (
                    <HintLabel termId="formation">
                      {proposal.stageLabel}
                    </HintLabel>
                  ) : (
                    proposal.stageLabel
                  )}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {proposal.summaryPill}
                </Badge>
              </>
            }
          >
            <p className="text-sm text-muted">{proposal.summary}</p>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {proposal.stageData.map((item) => (
                <StageDataTile
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  value={item.value}
                  tone={item.tone}
                />
              ))}
            </div>

            <ul className="grid gap-2 text-sm text-text md:grid-cols-2">
              {proposal.stats.map((stat) => (
                <DashedStatItem
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/human-nodes/${proposal.proposerId}`}
                className="text-sm font-semibold text-primary"
              >
                Proposer: {proposal.proposer}
              </Link>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const primaryHref =
                    proposal.stage === "pool"
                      ? `/proposals/${proposal.id}/pp`
                      : proposal.stage === "vote"
                        ? `/proposals/${proposal.id}/chamber`
                        : proposal.stage === "build"
                          ? `/proposals/${proposal.id}/formation`
                          : `/proposals/${proposal.id}/pp`;
                  return (
                    <Button asChild size="sm">
                      <Link to={primaryHref}>{proposal.ctaPrimary}</Link>
                    </Button>
                  );
                })()}
                {proposal.ctaSecondary ? (
                  <Button size="sm" variant="ghost">
                    {proposal.ctaSecondary}
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

export default Proposals;

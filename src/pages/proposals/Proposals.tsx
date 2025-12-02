import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Stage = "pool" | "vote" | "build" | "final" | "archived";
type ProofWeight = "pot" | "pod" | "pog";

type StageDatum = {
  title: string;
  description: string;
  value: string;
  tone?: "ok" | "warn";
};

type ProposalStat = {
  label: string;
  value: string;
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
      { label: "Proof mix", value: "PoT 45% · PoD 35% · PoG 20%" },
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
    stats: [
      { label: "Formation impact", value: "Medium" },
      { label: "Votes casted", value: "34" },
      { label: "Proof mix", value: "PoT 30% · PoD 50% · PoG 20%" },
    ],
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
    stats: [
      { label: "Equipment budget", value: "60k HMND" },
      { label: "Rollout scope", value: "42 sentinel nodes" },
    ],
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
  pool: "border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/10 text-primary",
  vote: "border border-indigo-500/30 bg-indigo-500/10 text-indigo-500",
  build: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  final: "border border-amber-500/30 bg-amber-500/10 text-amber-600",
  archived: "border border-slate-400/40 bg-slate-400/10 text-muted",
};

const chipOptions = [
  "Infrastructure",
  "Formation",
  "Security",
  "Research",
  "Community",
  "High quorum",
];

const statusOptions: { label: string; value: Stage | "any" }[] = [
  { label: "Any", value: "any" },
  { label: "Proposal pool", value: "pool" },
  { label: "Chamber vote", value: "vote" },
  { label: "Formation build", value: "build" },
  { label: "Final vote", value: "final" },
  { label: "Refused / archived", value: "archived" },
];

const chamberOptions = [
  "All chambers",
  "Protocol Engineering",
  "Economics & Treasury",
  "Security & Infra",
  "Constitutional",
  "Social Impact",
];

const tierOptions = [
  "Any",
  "Nominee",
  "Tribune",
  "Legate",
  "Consul",
  "Citizen",
];
const proofOptions = ["Any", "PoT heavy", "PoD heavy", "PoG heavy"];
const sortOptions = ["Newest", "Oldest", "Activity", "Votes casted"];

const Proposals: React.FC = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Stage | "any">("any");
  const [chamberFilter, setChamberFilter] = useState("All chambers");
  const [tierFilter, setTierFilter] = useState("Any");
  const [proofFilter, setProofFilter] = useState("Any");
  const [sortBy, setSortBy] = useState("Newest");
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtersPanelId = `${useId()}-filters`;
  const keywordId = `${useId()}-keyword`;
  const statusId = `${useId()}-status`;
  const chamberId = `${useId()}-chamber`;
  const tierId = `${useId()}-tier`;
  const proofId = `${useId()}-proof`;
  const sortId = `${useId()}-sort`;

  const activeFilters =
    (search.trim() ? 1 : 0) +
    (statusFilter !== "any" ? 1 : 0) +
    (chamberFilter !== "All chambers" ? 1 : 0) +
    (tierFilter !== "Any" ? 1 : 0) +
    (proofFilter !== "Any" ? 1 : 0) +
    (selectedChip ? 1 : 0);

  const filteredProposals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return proposalData
      .filter((proposal) => {
        const matchesSearch = term
          ? proposal.title.toLowerCase().includes(term) ||
            proposal.summary.toLowerCase().includes(term) ||
            proposal.meta.toLowerCase().includes(term) ||
            proposal.keywords.some((keyword) =>
              keyword.toLowerCase().includes(term),
            )
          : true;

        const matchesStatus =
          statusFilter === "any" ? true : proposal.stage === statusFilter;
        const matchesChamber =
          chamberFilter === "All chambers"
            ? true
            : proposal.chamber === chamberFilter;
        const matchesTier =
          tierFilter === "Any" ? true : proposal.tier === tierFilter;

        const proofMatch =
          proofFilter === "Any"
            ? true
            : (proofFilter === "PoT heavy" && proposal.proofFocus === "pot") ||
              (proofFilter === "PoD heavy" && proposal.proofFocus === "pod") ||
              (proofFilter === "PoG heavy" && proposal.proofFocus === "pog");

        const chipMatch = selectedChip
          ? proposal.tags.includes(selectedChip)
          : true;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesChamber &&
          matchesTier &&
          proofMatch &&
          chipMatch
        );
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
        if (sortBy === "Votes casted") {
          return b.votes - a.votes;
        }
        return 0;
      });
  }, [
    search,
    statusFilter,
    chamberFilter,
    tierFilter,
    proofFilter,
    selectedChip,
    sortBy,
  ]);

  const toggleChip = (chip: string) => {
    setSelectedChip((current) => (current === chip ? null : chip));
  };

  const toggleProposal = (id: string) => {
    setExpanded((current) => (current === id ? null : id));
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("any");
    setChamberFilter("All chambers");
    setTierFilter("Any");
    setProofFilter("Any");
    setSortBy("Newest");
    setSelectedChip(null);
  };

  const filtersHint = filtersOpen
    ? activeFilters
      ? `${activeFilters} active`
      : "Expanded"
    : activeFilters
      ? `${activeFilters} active`
      : "Collapsed";

  return (
    <div className="app-page flex flex-col gap-6">
      <div className="flex justify-end">
        <Button asChild size="sm" className="rounded-full px-4">
          <Link to="/proposals/new">Create proposal</Link>
        </Button>
      </div>

      <Card className="bg-panel overflow-hidden border border-border">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls={filtersPanelId}
          onClick={() => setFiltersOpen((open) => !open)}
          className="hover:bg-panel-alt flex w-full items-center justify-between px-5 py-4 text-left transition"
        >
          <div>
            <p className="text-base font-semibold text-(--text)">
              Filters & search
            </p>
            <p className="text-xs text-muted">{filtersHint}</p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted transition-transform",
              filtersOpen && "rotate-180",
            )}
          />
        </button>

        {filtersOpen && (
          <div
            id={filtersPanelId}
            className="space-y-6 border-t border-border p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-3">
                <label
                  htmlFor={keywordId}
                  className="flex flex-col gap-2 text-sm font-medium text-(--text)"
                >
                  <span>Keyword search</span>
                  <div className="flex items-center gap-2">
                    <Input
                      id={keywordId}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Proposal, hash, proposer…"
                      aria-label="Search proposals"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      aria-label="Run search"
                    >
                      <Search className="h-4 w-4 text-muted" />
                    </Button>
                  </div>
                </label>
              </div>

              <label
                htmlFor={statusId}
                className="flex flex-col gap-2 text-sm font-medium text-(--text)"
              >
                <span>Status</span>
                <Select
                  id={statusId}
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as Stage | "any")
                  }
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>

              <label
                htmlFor={chamberId}
                className="flex flex-col gap-2 text-sm font-medium text-(--text)"
              >
                <span>Chamber</span>
                <Select
                  id={chamberId}
                  value={chamberFilter}
                  onChange={(event) => setChamberFilter(event.target.value)}
                >
                  {chamberOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </label>

              <label
                htmlFor={tierId}
                className="flex flex-col gap-2 text-sm font-medium text-(--text)"
              >
                <span>Tier requirement</span>
                <Select
                  id={tierId}
                  value={tierFilter}
                  onChange={(event) => setTierFilter(event.target.value)}
                >
                  {tierOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </label>

              <label
                htmlFor={proofId}
                className="flex flex-col gap-2 text-sm font-medium text-(--text)"
              >
                <span>Proof emphasis</span>
                <Select
                  id={proofId}
                  value={proofFilter}
                  onChange={(event) => setProofFilter(event.target.value)}
                >
                  {proofOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </label>

              <label
                htmlFor={sortId}
                className="flex flex-col gap-2 text-sm font-medium text-(--text)"
              >
                <span>Sort by</span>
                <Select
                  id={sortId}
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {chipOptions.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-medium transition",
                    selectedChip === chip
                      ? "border-transparent bg-primary text-white shadow"
                      : "bg-panel-alt border-border text-(--text) hover:border-[color:var(--primary-dim)]",
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={resetFilters}
              >
                Reset
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={() => setFiltersOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </Card>

      <section aria-live="polite" className="flex flex-col gap-4">
        {filteredProposals.length === 0 && (
          <Card className="bg-panel border border-dashed border-border px-5 py-6 text-center text-sm text-muted">
            No proposals match the current search.
          </Card>
        )}

        {filteredProposals.map((proposal) => (
          <Card
            key={proposal.id}
            className="bg-panel overflow-hidden border border-border"
          >
            <button
              type="button"
              className="hover:bg-panel-alt flex w-full flex-col gap-4 px-5 py-4 text-left transition sm:flex-row sm:items-center sm:justify-between"
              aria-expanded={expanded === proposal.id}
              onClick={() => toggleProposal(proposal.id)}
            >
              <div className="space-y-1">
                <p className="text-xs tracking-wide text-muted uppercase">
                  {proposal.meta}
                </p>
                <p className="text-lg font-semibold text-(--text)">
                  {proposal.title}
                </p>
              </div>
              <div className="flex flex-col gap-2 text-right sm:flex-row sm:items-center sm:gap-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                    stageStyles[proposal.stage],
                  )}
                >
                  {proposal.stageLabel}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {proposal.summaryPill}
                </Badge>
                <ChevronDown
                  className={cn(
                    "ml-auto h-5 w-5 text-muted transition-transform sm:ml-0",
                    expanded === proposal.id && "rotate-180",
                  )}
                />
              </div>
            </button>

            {expanded === proposal.id && (
              <div className="space-y-5 border-t border-border px-5 py-5">
                <p className="text-sm text-muted">{proposal.summary}</p>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {proposal.stageData.map((item) => (
                    <div
                      key={item.title}
                      className="bg-panel-alt rounded-xl border border-border p-4"
                    >
                      <p className="text-sm font-semibold text-muted">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted">{item.description}</p>
                      <p
                        className={cn(
                          "text-lg font-semibold text-(--text)",
                          item.tone === "ok" && "text-emerald-500",
                          item.tone === "warn" && "text-amber-500",
                        )}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <ul className="grid gap-2 text-sm text-(--text) md:grid-cols-2">
                  {proposal.stats.map((stat) => (
                    <li
                      key={stat.label}
                      className="bg-panel-alt rounded-xl border border-dashed border-border/70 px-4 py-3"
                    >
                      <span className="font-semibold">{stat.label}:</span>{" "}
                      {stat.value}
                    </li>
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
                    <Button size="sm" variant="ghost">
                      {proposal.ctaSecondary}
                    </Button>
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

export default Proposals;

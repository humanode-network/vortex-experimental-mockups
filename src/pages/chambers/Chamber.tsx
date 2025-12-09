import { type FormEvent, useMemo, useState } from "react";
import { useParams, Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HintLabel } from "@/components/Hint";
import { HintLabel } from "@/components/Hint";

type ProposalStage = "upcoming" | "live" | "ended";

type ChamberProposal = {
  id: string;
  title: string;
  meta: string;
  summary: string;
  lead: string;
  nextStep: string;
  timing: string;
  stage: ProposalStage;
};

type Governor = {
  id: string;
  name: string;
  tier: string;
  focus: string;
};

type Thread = {
  id: string;
  title: string;
  author: string;
  replies: number;
  updated: string;
};

type ChatMessage = {
  id: string;
  author: string;
  message: string;
};

const proposalStageOptions: { value: ProposalStage; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "ended", label: "Ended" },
];

const proposals: ChamberProposal[] = [
  {
    id: "sequencer-upgrade",
    title: "Sequencer redundancy rollout",
    meta: "Legate · Protocol Engineering",
    summary:
      "Enable redundant biometric sequencers to lower failover time and unlock epoch double commits.",
    lead: "JohnDoe",
    nextStep: "Awaiting quorum scheduling",
    timing: "Scheduled · 02d 14h",
    stage: "upcoming",
  },
  {
    id: "vm-benchmarks",
    title: "VM verifier benchmarks",
    meta: "Consul · Protocol Engineering",
    summary:
      "Establish baseline performance telemetry for new WASM verifier prior to production slot.",
    lead: "Victor",
    nextStep: "Vote closes in",
    timing: "Live · 05h 42m",
    stage: "live",
  },
  {
    id: "formation-slot-requests",
    title: "Formation slot requests",
    meta: "Legate · Formation Logistics",
    summary:
      "Allocate three additional slot pools for biometrics research squads.",
    lead: "Sesh",
    nextStep: "Archived outcome",
    timing: "Ended · Passed",
    stage: "ended",
  },
];

const governors: Governor[] = [
  { id: "johndoe", name: "JohnDoe", tier: "Legate", focus: "Protocol" },
  { id: "victor", name: "Victor", tier: "Consul", focus: "Economics" },
  { id: "sesh", name: "Sesh", tier: "Legate", focus: "Security" },
  { id: "nyx", name: "Nyx", tier: "Ecclesiast", focus: "Infra" },
  { id: "nana", name: "Nana", tier: "Consul", focus: "Formation" },
  { id: "raamara", name: "Raamara", tier: "Consul", focus: "Treasury" },
];

const threads: Thread[] = [
  {
    id: "thread-1",
    title: "Sequencer redundancy rollout",
    author: "JohnDoe",
    replies: 4,
    updated: "1h ago",
  },
  {
    id: "thread-2",
    title: "VM verifier benchmarks",
    author: "Victor",
    replies: 11,
    updated: "3h ago",
  },
  {
    id: "thread-3",
    title: "Formation slot requests",
    author: "Sesh",
    replies: 6,
    updated: "6h ago",
  },
];

const chatLog: ChatMessage[] = [
  {
    id: "chat-1",
    author: "JohnDoe",
    message: "Milestone 2 patch deployed, please verify.",
  },
  {
    id: "chat-2",
    author: "Victor",
    message: "Treasury hook live, watching KPIs.",
  },
  {
    id: "chat-3",
    author: "Sesh",
    message: "Need 2 reviewers for the new biometrics spec.",
  },
];

const Chamber: React.FC = () => {
  const { id } = useParams();
  const chamberTitle = id ? id.replace(/-/g, " ") : "Chamber";

  const [stageFilter, setStageFilter] = useState<ProposalStage>("upcoming");
  const [governorSearch, setGovernorSearch] = useState("");
  const [chatInput, setChatInput] = useState("");

  const filteredProposals = useMemo(
    () => proposals.filter((proposal) => proposal.stage === stageFilter),
    [stageFilter],
  );

  const filteredGovernors = useMemo(() => {
    const term = governorSearch.toLowerCase();
    return governors.filter(
      (gov) =>
        gov.name.toLowerCase().includes(term) ||
        gov.tier.toLowerCase().includes(term) ||
        gov.focus.toLowerCase().includes(term),
    );
  }, [governorSearch]);

  const handleChatSubmit = (event: FormEvent) => {
    event.preventDefault();
    setChatInput("");
  };

  return (
    <div className="app-page flex flex-col gap-6">
      <div>
        <p className="text-xs tracking-wide text-muted uppercase">
          Chamber detail
        </p>
        <h1 className="text-xl font-semibold text-(--text) capitalize">
          {chamberTitle}
        </h1>
        <p className="text-sm text-muted">
          Proposal status, governor roster, and forum activity for this chamber.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="bg-panel border border-border">
          <CardHeader className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs tracking-wide text-muted uppercase">
                Chamber vote
              </p>
              <CardTitle>Proposal status</CardTitle>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Proposal stages"
            >
              {proposalStageOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  role="tab"
                  size="sm"
                  aria-selected={stageFilter === option.value}
                  variant={stageFilter === option.value ? "primary" : "outline"}
                  className="rounded-full px-4"
                  onClick={() => setStageFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredProposals.length === 0 ? (
              <p className="bg-panel-alt rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted">
                No proposals in this stage.
              </p>
            ) : (
              filteredProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-panel-alt rounded-2xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs tracking-wide text-muted uppercase">
                        {proposal.meta}
                      </p>
                      <h3 className="text-lg font-semibold text-(--text)">
                        {proposal.title}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="font-semibold"
                    >
                      Lead {proposal.lead}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-(--text)">
                    {proposal.summary}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
                    <div className="bg-panel rounded-xl border border-border px-3 py-2">
                      <p className="text-xs tracking-wide uppercase">
                        Next step
                      </p>
                      <p className="text-sm font-semibold text-(--text)">
                        {proposal.nextStep}
                      </p>
                    </div>
                    <div className="bg-panel rounded-xl border border-border px-3 py-2">
                      <p className="text-xs tracking-wide uppercase">Timing</p>
                      <p className="text-sm font-semibold text-(--text)">
                        {proposal.timing}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-panel border border-border">
          <CardHeader className="flex items-center justify-between pb-3">
            <div>
              <p className="text-xs tracking-wide text-muted uppercase">
                Governors
              </p>
              <CardTitle>Chamber roster</CardTitle>
            </div>
            <span className="bg-panel-alt rounded-full border border-border px-3 py-1 text-sm font-semibold">
              {governors.length}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={governorSearch}
              onChange={(event) => setGovernorSearch(event.target.value)}
              placeholder="Search governors"
            />
            <ul className="max-h-[360px] space-y-2 overflow-auto pr-1 text-sm text-(--text)">
              {filteredGovernors.map((gov) => (
                <li
                  key={gov.id}
                  className="bg-panel-alt flex items-center justify-between rounded-xl border border-border px-3 py-2"
                >
                  <div>
                    <p className="font-semibold">{gov.name}</p>
                    <p className="text-xs text-muted">
                      <HintLabel
                        termId={
                          gov.tier === "Nominee"
                            ? "tier1_nominee"
                            : gov.tier === "Ecclesiast"
                              ? "tier2_ecclesiast"
                              : gov.tier === "Legate"
                                ? "tier3_legate"
                                : gov.tier === "Consul"
                                  ? "tier4_consul"
                                  : "tier5_citizen"
                        }
                      >
                        {gov.tier}
                      </HintLabel>{" "}
                      · {gov.focus}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/human-nodes/${gov.name}`}>Profile</Link>
                  </Button>
                </li>
              ))}
              {filteredGovernors.length === 0 && (
                <li className="bg-panel-alt rounded-xl border border-dashed border-border/70 px-3 py-4 text-center text-muted">
                  No governors found.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section className="bg-panel rounded-2xl border border-border p-5">
        <header className="mb-4 flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs tracking-wide text-muted uppercase">
              Chamber forum
            </p>
            <h2 className="text-lg font-semibold text-(--text)">
              Threads & chat
            </h2>
          </div>
          <Button variant="ghost" size="sm">
            New thread
          </Button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-3">
            {threads.map((thread) => (
              <article
                key={thread.id}
                className="bg-panel-alt rounded-2xl border border-border px-4 py-3 shadow-sm"
              >
                <h3 className="text-base font-semibold text-(--text)">
                  {thread.title}
                </h3>
                <p className="text-sm text-muted">
                  {thread.author} · {thread.replies} replies · Updated{" "}
                  {thread.updated}
                </p>
              </article>
            ))}
          </div>

          <div className="bg-panel-alt rounded-2xl border border-border p-4 shadow-sm">
            <header className="text-sm font-semibold text-(--text)">
              Chamber chat
            </header>
            <div className="my-3 max-h-64 space-y-2 overflow-auto pr-2 text-sm">
              {chatLog.map((entry) => (
                <p key={entry.id}>
                  <strong>{entry.author}:</strong> {entry.message}
                </p>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={handleChatSubmit}>
              <Input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Send a message"
              />
              <Button type="submit" size="sm">
                Send
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Chamber;

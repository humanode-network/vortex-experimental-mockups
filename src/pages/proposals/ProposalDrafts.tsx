import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHint } from "@/components/PageHint";

type Draft = {
  id: string;
  title: string;
  chamber: string;
  tier: string;
  summary: string;
  updated: string;
};

const drafts: Draft[] = [
  {
    id: "draft-telemetry",
    title: "Mesh Telemetry Upgrade",
    chamber: "Protocol Engineering",
    tier: "Legate",
    summary: "Refine telemetry ingestion for sequencer failover playbooks.",
    updated: "2025-03-28",
  },
  {
    id: "draft-fee-ramp",
    title: "Adaptive Fee Ramp",
    chamber: "Economics & Treasury",
    tier: "Consul",
    summary: "Set fee ramps tied to quorum activity and biometric load.",
    updated: "2025-03-22",
  },
  {
    id: "draft-formation-kit",
    title: "Formation Ops Kit",
    chamber: "Formation Logistics",
    tier: "Tribune",
    summary: "Starter kit for squads: playbooks, dashboards, and SLOs.",
    updated: "2025-03-19",
  },
];

const ProposalDrafts: React.FC = () => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return drafts;
    return drafts.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.chamber.toLowerCase().includes(term) ||
        d.summary.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <div className="app-page flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/proposals">Back to proposals</Link>
          </Button>
          <PageHint pageId="proposals" />
        </div>
        <Button asChild size="sm">
          <Link to="/proposals/new">Edit proposal</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-(--text)">Drafts</h1>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drafts by title or chamber…"
          className="max-w-md"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((draft) => (
          <Card
            key={draft.id}
            className="bg-panel border border-border p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-wide text-muted uppercase">
                  Draft · {draft.updated}
                </p>
                <h2 className="text-lg font-semibold text-(--text)">
                  {draft.title}
                </h2>
                <p className="text-sm text-muted">{draft.summary}</p>
              </div>
              <Badge variant="outline">{draft.chamber}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted">
              <span>Tier: {draft.tier}</span>
              <Button asChild size="sm" variant="ghost">
                <Link to={`/proposals/drafts/${draft.id}`}>Open draft</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProposalDrafts;

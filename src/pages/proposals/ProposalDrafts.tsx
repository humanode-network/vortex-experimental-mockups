import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/SearchBar";
import { AppPage } from "@/components/AppPage";

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
  const [sortBy, setSortBy] = useState<"updated" | "chamber">("updated");
  const [chamberFilter, setChamberFilter] = useState<string>("any");
  const chambers = useMemo(
    () => Array.from(new Set(drafts.map((d) => d.chamber))),
    [],
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...drafts]
      .filter(
        (d) =>
          (term.length === 0 ||
            d.title.toLowerCase().includes(term) ||
            d.chamber.toLowerCase().includes(term) ||
            d.summary.toLowerCase().includes(term)) &&
          (chamberFilter === "any" ? true : d.chamber === chamberFilter),
      )
      .sort((a, b) => {
        if (sortBy === "chamber") return a.chamber.localeCompare(b.chamber);
        return b.updated.localeCompare(a.updated);
      });
  }, [query, sortBy, chamberFilter]);

  return (
    <AppPage pageId="proposals">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/proposals">Back to proposals</Link>
          </Button>
        </div>
        <Button asChild size="sm">
          <Link to="/proposals/new">Edit proposal</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">Drafts</h1>
        <SearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drafts by title or chamber…"
          ariaLabel="Search drafts"
          className="max-w-md"
          filtersConfig={[
            {
              key: "chamberFilter",
              label: "Chamber",
              options: [
                { value: "any", label: "Any chamber" },
                ...chambers.map((c) => ({ value: c, label: c })),
              ],
            },
            {
              key: "sortBy",
              label: "Sort by",
              options: [
                { value: "updated", label: "Updated (newest)" },
                { value: "chamber", label: "Chamber (A–Z)" },
              ],
            },
          ]}
          filtersState={{ chamberFilter, sortBy }}
          onFiltersChange={(next) => {
            if (next.chamberFilter) setChamberFilter(next.chamberFilter);
            if (next.sortBy) setSortBy(next.sortBy as "updated" | "chamber");
          }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((draft) => (
          <Card key={draft.id} className="border border-border bg-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-wide text-muted uppercase">
                  Draft · {draft.updated}
                </p>
                <h2 className="text-lg font-semibold text-text">
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
    </AppPage>
  );
};

export default ProposalDrafts;

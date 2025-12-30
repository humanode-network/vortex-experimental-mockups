import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import { SearchBar } from "@/components/SearchBar";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { apiProposalDrafts } from "@/lib/apiClient";
import type { ProposalDraftListItemDto } from "@/types/api";

const ProposalDrafts: React.FC = () => {
  const [drafts, setDrafts] = useState<ProposalDraftListItemDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{
    sortBy: "updated" | "chamber";
    chamberFilter: string;
  }>({ sortBy: "updated", chamberFilter: "any" });
  const { sortBy, chamberFilter } = filters;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiProposalDrafts();
        if (!active) return;
        setDrafts(res.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setDrafts([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const chambers = useMemo(
    () => Array.from(new Set((drafts ?? []).map((d) => d.chamber))),
    [drafts],
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...(drafts ?? [])]
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
  }, [drafts, query, sortBy, chamberFilter]);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/proposals">Back to proposals</Link>
          </Button>
        </div>
        <Button asChild size="sm">
          <Link to="/app/proposals/new">New proposal</Link>
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
          filtersState={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {drafts === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading drafts…
        </Card>
      ) : null}
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          Drafts unavailable: {loadError}
        </Card>
      ) : null}
      {drafts !== null && drafts.length === 0 && !loadError ? (
        <NoDataYetBar label="drafts" />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((draft) => (
          <Card key={draft.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Kicker>Draft · {draft.updated}</Kicker>
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
                <Link to={`/app/proposals/drafts/${draft.id}`}>Open draft</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProposalDrafts;

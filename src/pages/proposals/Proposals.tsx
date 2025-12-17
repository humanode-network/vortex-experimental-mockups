import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { SearchBar } from "@/components/SearchBar";
import { PageHint } from "@/components/PageHint";
import { ExpandableCard } from "@/components/ExpandableCard";
import { StageDataTile } from "@/components/StageDataTile";
import { DashedStatItem } from "@/components/DashedStatItem";
import { StageChip } from "@/components/StageChip";
import type { ProposalStage } from "@/types/stages";
import { CardActionsRow } from "@/components/CardActionsRow";
import { proposals as proposalData } from "@/data/mock/proposals";

const Proposals: React.FC = () => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    stageFilter: ProposalStage | "any";
    chamberFilter: string;
    sortBy: "Newest" | "Oldest" | "Activity" | "Votes";
  }>({
    stageFilter: "any",
    chamberFilter: "All chambers",
    sortBy: "Newest",
  });
  const { stageFilter, chamberFilter, sortBy } = filters;

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

  const toggleProposal = (id: string) => {
    setExpanded((current) => (current === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
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
        filtersConfig={[
          {
            key: "stageFilter",
            label: "Status",
            options: [
              { value: "any", label: "Any" },
              { value: "pool", label: "Proposal pool" },
              { value: "vote", label: "Chamber vote" },
              { value: "build", label: "Formation" },
              { value: "final", label: "Final vote" },
              { value: "archived", label: "Archived" },
            ],
          },
          {
            key: "chamberFilter",
            label: "Chamber",
            options: [
              { value: "All chambers", label: "All chambers" },
              { value: "Protocol Engineering", label: "Protocol Engineering" },
              { value: "Economics & Treasury", label: "Economics & Treasury" },
              { value: "Security & Infra", label: "Security & Infra" },
              { value: "Constitutional", label: "Constitutional" },
              { value: "Social Impact", label: "Social Impact" },
            ],
          },
          {
            key: "sortBy",
            label: "Sort by",
            options: [
              { value: "Newest", label: "Newest" },
              { value: "Oldest", label: "Oldest" },
              { value: "Activity", label: "Activity" },
              { value: "Votes", label: "Votes casted" },
            ],
          },
        ]}
        filtersState={filters}
        onFiltersChange={setFilters}
      />

      <section aria-live="polite" className="flex flex-col gap-4">
        {filteredProposals.length === 0 && (
          <Card className="border-dashed px-5 py-6 text-center text-sm text-muted">
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
                <StageChip stage={proposal.stage} />
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

            <CardActionsRow
              proposer={proposal.proposer}
              proposerId={proposal.proposerId}
              primaryHref={
                proposal.stage === "pool"
                  ? `/proposals/${proposal.id}/pp`
                  : proposal.stage === "vote"
                    ? `/proposals/${proposal.id}/chamber`
                    : proposal.stage === "build"
                      ? `/proposals/${proposal.id}/formation`
                      : `/proposals/${proposal.id}/pp`
              }
              primaryLabel={proposal.ctaPrimary}
              secondaryLabel={proposal.ctaSecondary}
              secondaryVariant="ghost"
            />
          </ExpandableCard>
        ))}
      </section>
    </div>
  );
};

export default Proposals;

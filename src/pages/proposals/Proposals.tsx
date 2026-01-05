import { useEffect, useMemo, useState } from "react";
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
import { Surface } from "@/components/Surface";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import {
  apiProposalChamberPage,
  apiProposalFormationPage,
  apiProposalPoolPage,
  apiProposals,
} from "@/lib/apiClient";
import type {
  ChamberProposalPageDto,
  FormationProposalPageDto,
  PoolProposalPageDto,
  ProposalListItemDto,
} from "@/types/api";

const Proposals: React.FC = () => {
  const [proposalData, setProposalData] = useState<
    ProposalListItemDto[] | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const [poolPagesById, setPoolPagesById] = useState<
    Record<string, PoolProposalPageDto | undefined>
  >({});
  const [chamberPagesById, setChamberPagesById] = useState<
    Record<string, ChamberProposalPageDto | undefined>
  >({});
  const [formationPagesById, setFormationPagesById] = useState<
    Record<string, FormationProposalPageDto | undefined>
  >({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiProposals();
        if (!active) return;
        setProposalData(res.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setProposalData([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!expanded || !proposalData) return;
    const proposal = proposalData.find((p) => p.id === expanded);
    if (!proposal) return;

    if (proposal.stage === "pool" && poolPagesById[proposal.id] === undefined) {
      void apiProposalPoolPage(proposal.id).then((page) => {
        setPoolPagesById((curr) => ({ ...curr, [proposal.id]: page }));
      });
    }
    if (
      proposal.stage === "vote" &&
      chamberPagesById[proposal.id] === undefined
    ) {
      void apiProposalChamberPage(proposal.id).then((page) => {
        setChamberPagesById((curr) => ({ ...curr, [proposal.id]: page }));
      });
    }
    if (
      proposal.stage === "build" &&
      formationPagesById[proposal.id] === undefined
    ) {
      void apiProposalFormationPage(proposal.id).then((page) => {
        setFormationPagesById((curr) => ({ ...curr, [proposal.id]: page }));
      });
    }
  }, [
    expanded,
    proposalData,
    poolPagesById,
    chamberPagesById,
    formationPagesById,
  ]);

  const filteredProposals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (proposalData ?? [])
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
  }, [proposalData, search, stageFilter, chamberFilter, sortBy]);

  const chamberOptions = useMemo(() => {
    const unique = Array.from(
      new Set((proposalData ?? []).map((p) => p.chamber)),
    ).sort((a, b) => a.localeCompare(b));
    return [
      { value: "All chambers", label: "All chambers" },
      ...unique.map((chamber) => ({ value: chamber, label: chamber })),
    ];
  }, [proposalData]);

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
          <Link to="/app/proposals/drafts">Drafts</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/app/proposals/new">Create proposal</Link>
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
            options: chamberOptions,
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

      {proposalData === null ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Loading proposals…
        </Surface>
      ) : null}
      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          Proposals unavailable: {loadError}
        </Surface>
      ) : null}

      {proposalData !== null && proposalData.length === 0 && !loadError ? (
        <NoDataYetBar label="proposals" />
      ) : null}

      <section aria-live="polite" className="flex flex-col gap-4">
        {proposalData !== null &&
          proposalData.length > 0 &&
          filteredProposals.length === 0 && (
            <Card className="border-dashed px-5 py-6 text-center text-sm text-muted">
              No proposals match the current search.
            </Card>
          )}

        {filteredProposals.map((proposal) =>
          // Collapsed state stays lightweight; expanded state is stage-aware.
          // Collapsed preview and expanded content are stage-aware, but always
          // keep the same "card skeleton": summary + stage module + key stats.
          (() => {
            const poolPage =
              proposal.stage === "pool" ? poolPagesById[proposal.id] : null;
            const chamberPage =
              proposal.stage === "vote" ? chamberPagesById[proposal.id] : null;
            const formationPage =
              proposal.stage === "build"
                ? formationPagesById[proposal.id]
                : null;

            const poolStats =
              proposal.stage === "pool" && poolPage
                ? (() => {
                    const [filledSlots, totalSlots] = poolPage.teamSlots
                      .split("/")
                      .map((v) => Number(v.trim()));
                    const openSlots = Math.max(totalSlots - filledSlots, 0);
                    const milestonesCount = Number(poolPage.milestones);
                    const engaged = poolPage.upvotes + poolPage.downvotes;
                    const attentionPercent = Math.round(
                      (engaged / poolPage.activeGovernors) * 100,
                    );
                    const attentionNeededPercent = Math.round(
                      poolPage.attentionQuorum * 100,
                    );
                    const upvoteFloorPercent = Math.round(
                      (poolPage.upvoteFloor / poolPage.activeGovernors) * 100,
                    );
                    const upvoteCurrentPercent = Math.round(
                      (poolPage.upvotes / poolPage.activeGovernors) * 100,
                    );
                    const meetsAttention =
                      engaged / poolPage.activeGovernors >=
                      poolPage.attentionQuorum;
                    const meetsUpvoteFloor =
                      poolPage.upvotes >= poolPage.upvoteFloor;
                    const engagedNeeded = Math.ceil(
                      poolPage.attentionQuorum * poolPage.activeGovernors,
                    );

                    return {
                      filledSlots,
                      openSlots,
                      milestonesCount: Number.isFinite(milestonesCount)
                        ? milestonesCount
                        : poolPage.milestones,
                      engaged,
                      attentionPercent,
                      attentionNeededPercent,
                      upvoteFloorPercent,
                      upvoteCurrentPercent,
                      meetsAttention,
                      meetsUpvoteFloor,
                      engagedNeeded,
                      upvoteFloor: poolPage.upvoteFloor,
                    };
                  })()
                : null;

            const chamberStats =
              proposal.stage === "vote" && chamberPage
                ? (() => {
                    const yesTotal = chamberPage.votes.yes;
                    const noTotal = chamberPage.votes.no;
                    const abstainTotal = chamberPage.votes.abstain;
                    const totalVotes = yesTotal + noTotal + abstainTotal;

                    const engaged = chamberPage.engagedGovernors;
                    const quorumNeeded = Math.ceil(
                      chamberPage.activeGovernors * chamberPage.attentionQuorum,
                    );
                    const quorumPercent = Math.round(
                      (engaged / chamberPage.activeGovernors) * 100,
                    );
                    const quorumNeededPercent = Math.round(
                      chamberPage.attentionQuorum * 100,
                    );
                    const yesPercentOfQuorum =
                      engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;

                    const [filledSlots, totalSlots] = chamberPage.teamSlots
                      .split("/")
                      .map((v) => Number(v.trim()));
                    const openSlots = Math.max(totalSlots - filledSlots, 0);

                    const meetsQuorum = engaged >= quorumNeeded;
                    const meetsPassing = yesPercentOfQuorum >= 66.6;

                    const yesWidth = totalVotes
                      ? (yesTotal / totalVotes) * 100
                      : 0;
                    const noWidth = totalVotes
                      ? (noTotal / totalVotes) * 100
                      : 0;
                    const abstainWidth = totalVotes
                      ? (abstainTotal / totalVotes) * 100
                      : 0;

                    return {
                      yesTotal,
                      noTotal,
                      abstainTotal,
                      totalVotes,
                      engaged,
                      quorumNeeded,
                      quorumPercent,
                      quorumNeededPercent,
                      yesPercentOfQuorum,
                      meetsQuorum,
                      meetsPassing,
                      yesWidth,
                      noWidth,
                      abstainWidth,
                      openSlots,
                    };
                  })()
                : null;

            const formationStats =
              proposal.stage === "build" && formationPage
                ? (() => {
                    const progressRaw = Number.parseInt(
                      formationPage.progress.replace("%", ""),
                      10,
                    );
                    const progressValue = Number.isFinite(progressRaw)
                      ? progressRaw
                      : 0;

                    const parsePair = (value: string) => {
                      const parts = value
                        .split("/")
                        .map((v) => Number(v.trim()));
                      if (parts.length !== 2) return { a: 0, b: 0 };
                      const [a, b] = parts;
                      return {
                        a: Number.isFinite(a) ? a : 0,
                        b: Number.isFinite(b) ? b : 0,
                      };
                    };

                    return {
                      progressValue,
                      team: parsePair(formationPage.teamSlots),
                      milestones: parsePair(formationPage.milestones),
                    };
                  })()
                : null;

            return (
              <ExpandableCard
                key={proposal.id}
                expanded={expanded === proposal.id}
                onToggle={() => toggleProposal(proposal.id)}
                title={proposal.title}
                right={
                  <>
                    <StageChip
                      stage={proposal.stage}
                      label={
                        proposal.stage === "build" &&
                        proposal.summaryPill === "Passed"
                          ? "Passed"
                          : undefined
                      }
                    />
                    <Badge
                      variant="muted"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {proposal.chamber.replace(/\s*chamber\s*$/i, "")}
                    </Badge>
                    <Badge
                      variant="muted"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {proposal.tier}
                    </Badge>
                  </>
                }
              >
                <section className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">Summary</p>
                    <p className="text-sm text-muted">{proposal.summary}</p>
                  </div>

                  {proposal.stage === "pool" && poolPage && poolStats ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Quorum of attention
                      </p>

                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="flex flex-wrap items-center justify-center gap-4 px-6 py-5 text-lg font-semibold"
                      >
                        <span className="text-accent">
                          {poolPage.upvotes} upvotes
                        </span>
                        <span className="text-muted">·</span>
                        <span className="text-destructive">
                          {poolPage.downvotes} downvotes
                        </span>
                        <span className="text-muted">·</span>
                        <span className="text-text">
                          {poolStats.engaged} / {poolPage.activeGovernors}{" "}
                          engaged
                        </span>
                      </Surface>

                      <div className="grid gap-3 md:grid-cols-2">
                        <StageDataTile
                          title="Attention quorum"
                          description={`Engaged ${poolStats.engaged} / ${poolStats.engagedNeeded} governors`}
                          value={`${poolStats.attentionPercent}% / ${poolStats.attentionNeededPercent}%`}
                          tone={poolStats.meetsAttention ? "ok" : "warn"}
                        />
                        <StageDataTile
                          title="Upvote floor"
                          description={`Upvotes ${poolPage.upvotes} / ${poolStats.upvoteFloor} governors`}
                          value={`${poolStats.upvoteCurrentPercent}% / ${poolStats.upvoteFloorPercent}%`}
                          tone={poolStats.meetsUpvoteFloor ? "ok" : "warn"}
                        />
                      </div>

                      <p className="text-xs text-muted">
                        To move to chamber vote, the pool must meet both the
                        attention quorum and the upvote floor.
                      </p>
                    </div>
                  ) : proposal.stage === "vote" &&
                    chamberPage &&
                    chamberStats ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Vote snapshot
                      </p>

                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="space-y-3 px-5 py-4"
                      >
                        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                          <div className="flex h-full w-full">
                            <div
                              className="h-full bg-accent"
                              style={{ width: `${chamberStats.yesWidth}%` }}
                            />
                            <div
                              className="h-full bg-destructive"
                              style={{ width: `${chamberStats.noWidth}%` }}
                            />
                            <div
                              className="h-full bg-muted"
                              style={{ width: `${chamberStats.abstainWidth}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-accent" />
                              Yes {chamberStats.yesTotal}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-destructive" />
                              No {chamberStats.noTotal}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-muted" />
                              Abstain {chamberStats.abstainTotal}
                            </span>
                          </div>
                          <span>
                            Total {chamberStats.totalVotes} · Time left{" "}
                            {chamberPage.timeLeft}
                          </span>
                        </div>
                      </Surface>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <StageDataTile
                          title="Voting quorum"
                          description={`Governors ${chamberStats.engaged} / ${chamberPage.activeGovernors} (needs ${chamberStats.quorumNeeded})`}
                          value={`${chamberStats.quorumPercent}% / ${chamberStats.quorumNeededPercent}%`}
                          tone={chamberStats.meetsQuorum ? "ok" : "warn"}
                        />
                        <StageDataTile
                          title="Passing"
                          description={chamberPage.passingRule}
                          value={`${chamberStats.yesPercentOfQuorum}% yes`}
                          tone={chamberStats.meetsPassing ? "ok" : "warn"}
                        />
                        <StageDataTile
                          title="Time left"
                          description="Voting window"
                          value={chamberPage.timeLeft}
                        />
                      </div>

                      <p className="text-xs text-muted">
                        If this passes, it moves to Formation for execution.
                      </p>
                    </div>
                  ) : proposal.stage === "build" &&
                    formationPage &&
                    formationStats ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-text">
                        Execution snapshot
                      </p>

                      <Surface
                        variant="panelAlt"
                        radius="2xl"
                        shadow="tile"
                        className="space-y-3 px-5 py-4"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-text">
                            Progress
                          </span>
                          <span className="font-semibold text-text">
                            {formationPage.progress}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full bg-accent"
                            style={{
                              width: `${Math.min(
                                Math.max(formationStats.progressValue, 0),
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                          <span>
                            Milestones {formationStats.milestones.a} /{" "}
                            {formationStats.milestones.b}
                          </span>
                          <span>
                            Team {formationStats.team.a} /{" "}
                            {formationStats.team.b}
                          </span>
                          <span>Time left {formationPage.timeLeft}</span>
                        </div>
                      </Surface>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {formationPage.stageData
                          .slice(0, 3)
                          .map((item, index) => (
                            <StageDataTile
                              key={`${proposal.id}-formation-${index}`}
                              title={item.title}
                              description={item.description}
                              value={item.value}
                            />
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-text">
                        Stage data
                      </p>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {proposal.stageData.map((item, index) => (
                          <StageDataTile
                            key={`${proposal.id}-stage-${index}`}
                            title={item.title}
                            description={item.description}
                            value={item.value}
                            tone={item.tone}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">Key stats</p>
                    <ul className="grid gap-2 text-sm text-text md:grid-cols-2">
                      {proposal.stage === "pool" && poolPage && poolStats ? (
                        <>
                          <DashedStatItem
                            label="Budget ask"
                            value={poolPage.budget}
                          />
                          <DashedStatItem
                            label="Formation"
                            value={poolPage.formationEligible ? "Yes" : "No"}
                          />
                          <DashedStatItem
                            label="Team slots"
                            value={`${poolPage.teamSlots} (open: ${poolStats.openSlots})`}
                          />
                          <DashedStatItem
                            label="Milestones"
                            value={`${poolStats.milestonesCount} planned`}
                          />
                          <DashedStatItem
                            label="Cooldown"
                            value={poolPage.cooldown}
                          />
                        </>
                      ) : proposal.stage === "vote" &&
                        chamberPage &&
                        chamberStats ? (
                        <>
                          <DashedStatItem
                            label="Budget ask"
                            value={chamberPage.budget}
                          />
                          <DashedStatItem
                            label="Formation"
                            value={chamberPage.formationEligible ? "Yes" : "No"}
                          />
                          <DashedStatItem
                            label="Team slots"
                            value={`${chamberPage.teamSlots} (open: ${chamberStats.openSlots})`}
                          />
                          <DashedStatItem
                            label="Milestones"
                            value={`${chamberPage.milestones} planned`}
                          />
                        </>
                      ) : proposal.stage === "build" && formationPage ? (
                        <>
                          <DashedStatItem
                            label="Budget ask"
                            value={formationPage.budget}
                          />
                          <DashedStatItem
                            label="Time left"
                            value={formationPage.timeLeft}
                          />
                          <DashedStatItem
                            label="Team slots"
                            value={formationPage.teamSlots}
                          />
                          <DashedStatItem
                            label="Milestones"
                            value={formationPage.milestones}
                          />
                          {formationPage.stats.map((stat) => (
                            <DashedStatItem
                              key={`${proposal.id}-formation-stat-${stat.label}`}
                              label={stat.label}
                              value={stat.value}
                            />
                          ))}
                        </>
                      ) : (
                        proposal.stats.map((stat) => (
                          <DashedStatItem
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                          />
                        ))
                      )}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {proposal.tags.map((tag) => (
                      <Badge key={tag} variant="muted" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <CardActionsRow
                    proposer={proposal.proposer}
                    proposerId={proposal.proposerId}
                    primaryHref={
                      proposal.stage === "pool"
                        ? `/app/proposals/${proposal.id}/pp`
                        : proposal.stage === "vote"
                          ? `/app/proposals/${proposal.id}/chamber`
                          : proposal.stage === "build"
                            ? proposal.summaryPill === "Passed"
                              ? `/app/proposals/${proposal.id}/chamber`
                              : `/app/proposals/${proposal.id}/formation`
                            : `/app/proposals/${proposal.id}/pp`
                    }
                    primaryLabel={proposal.ctaPrimary}
                  />
                </section>
              </ExpandableCard>
            );
          })(),
        )}
      </section>
    </div>
  );
};

export default Proposals;

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { PageHint } from "@/components/PageHint";
import { CardActionsRow } from "@/components/CardActionsRow";
import { DashedStatItem } from "@/components/DashedStatItem";
import { ExpandableCard } from "@/components/ExpandableCard";
import { StageChip } from "@/components/StageChip";
import { StageDataTile } from "@/components/StageDataTile";
import { Surface } from "@/components/Surface";
import { CourtStatusBadge } from "@/components/CourtStatusBadge";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import {
  apiCourt,
  apiFeed,
  apiProposalChamberPage,
  apiProposalFormationPage,
  apiProposalPoolPage,
} from "@/lib/apiClient";
import type { FeedItemDto } from "@/types/api";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day}/${month}/${year} · ${time}`;
};

const Feed: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItemDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [poolPagesById, setPoolPagesById] = useState<
    Record<string, import("@/types/api").PoolProposalPageDto | undefined>
  >({});
  const [chamberPagesById, setChamberPagesById] = useState<
    Record<string, import("@/types/api").ChamberProposalPageDto | undefined>
  >({});
  const [formationPagesById, setFormationPagesById] = useState<
    Record<string, import("@/types/api").FormationProposalPageDto | undefined>
  >({});
  const [courtCasesById, setCourtCasesById] = useState<
    Record<string, import("@/types/api").CourtCaseDetailDto | undefined>
  >({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFeed();
        if (!active) return;
        setFeedItems(res.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setFeedItems([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const sortedFeed = useMemo(() => {
    return [...(feedItems ?? [])].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [feedItems]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((curr) => (curr === id ? null : id));
  };

  const hrefFor = (href?: string) => {
    if (!href) return undefined;
    return href.startsWith("/app/") ? href : `/app${href}`;
  };

  const courtCaseIdFromHref = (href?: string) => {
    if (!href) return null;
    const clean = href.startsWith("/app/") ? href.slice("/app".length) : href;
    const match = clean.match(/^\/courts\/(.+)$/);
    return match?.[1] ?? null;
  };

  useEffect(() => {
    if (!expanded || !feedItems) return;
    const item = feedItems.find((p) => p.id === expanded);
    if (!item) return;

    if (item.stage === "pool" && poolPagesById[item.id] === undefined) {
      void apiProposalPoolPage(item.id).then((page) => {
        setPoolPagesById((curr) => ({ ...curr, [item.id]: page }));
      });
    }
    if (item.stage === "vote" && chamberPagesById[item.id] === undefined) {
      void apiProposalChamberPage(item.id).then((page) => {
        setChamberPagesById((curr) => ({ ...curr, [item.id]: page }));
      });
    }
    if (item.stage === "build" && formationPagesById[item.id] === undefined) {
      void apiProposalFormationPage(item.id).then((page) => {
        setFormationPagesById((curr) => ({ ...curr, [item.id]: page }));
      });
    }
    if (item.stage === "courts") {
      const caseId = courtCaseIdFromHref(item.href);
      if (caseId && courtCasesById[caseId] === undefined) {
        void apiCourt(caseId).then((page) => {
          setCourtCasesById((curr) => ({ ...curr, [caseId]: page }));
        });
      }
    }
  }, [
    expanded,
    feedItems,
    poolPagesById,
    chamberPagesById,
    formationPagesById,
    courtCasesById,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHint pageId="feed" />
      {/* Governing threshold moved to MyGovernance */}

      {feedItems === null ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Loading feed…
        </Surface>
      ) : null}
      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          Feed unavailable: {loadError}
        </Surface>
      ) : null}

      {feedItems !== null && feedItems.length === 0 && !loadError ? (
        <NoDataYetBar label="feed activity" />
      ) : null}

      <section aria-live="polite" className="flex flex-col gap-4">
        {sortedFeed.map((item, index) => {
          const poolPage =
            item.stage === "pool" ? poolPagesById[item.id] : null;
          const chamberPage =
            item.stage === "vote" ? chamberPagesById[item.id] : null;
          const formationPage =
            item.stage === "build" ? formationPagesById[item.id] : null;

          const poolStats =
            item.stage === "pool" && poolPage
              ? (() => {
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
            item.stage === "vote" && chamberPage
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

                  const meetsQuorum = engaged >= quorumNeeded;
                  const meetsPassing = yesPercentOfQuorum >= 66.6;

                  const yesWidth = totalVotes
                    ? (yesTotal / totalVotes) * 100
                    : 0;
                  const noWidth = totalVotes ? (noTotal / totalVotes) * 100 : 0;
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
                  };
                })()
              : null;

          const formationStats =
            item.stage === "build" && formationPage
              ? (() => {
                  const progressRaw = Number.parseInt(
                    formationPage.progress.replace("%", ""),
                    10,
                  );
                  const progressValue = Number.isFinite(progressRaw)
                    ? progressRaw
                    : 0;

                  const parsePair = (value: string) => {
                    const parts = value.split("/").map((v) => Number(v.trim()));
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

          const courtCase =
            item.stage === "courts"
              ? (() => {
                  const caseId = courtCaseIdFromHref(item.href);
                  return caseId ? (courtCasesById[caseId] ?? null) : null;
                })()
              : null;

          return (
            <ExpandableCard
              key={item.id}
              expanded={expanded === item.id}
              onToggle={() => toggle(item.id)}
              className={cn(index < 3 ? "border-primary" : "border-border")}
              meta={formatDate(item.timestamp)}
              title={item.title}
              right={
                <>
                  <StageChip stage={item.stage} />
                </>
              }
            >
              <section className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text">Summary</p>
                  <p className="text-sm text-muted">{item.summary}</p>
                </div>

                {item.stage === "pool" && poolPage && poolStats ? (
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
                        {poolStats.engaged} / {poolPage.activeGovernors} engaged
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
                  </div>
                ) : item.stage === "vote" && chamberPage && chamberStats ? (
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
                  </div>
                ) : item.stage === "build" &&
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
                          Team {formationStats.team.a} / {formationStats.team.b}
                        </span>
                        <span>Time left {formationPage.timeLeft}</span>
                      </div>
                    </Surface>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {formationPage.stageData.slice(0, 3).map((entry, idx) => (
                        <StageDataTile
                          key={`${item.id}-formation-${idx}`}
                          title={entry.title}
                          description={entry.description}
                          value={entry.value}
                        />
                      ))}
                    </div>
                  </div>
                ) : item.stage === "courts" ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-text">
                      Case snapshot
                    </p>

                    <Surface
                      variant="panelAlt"
                      radius="2xl"
                      shadow="tile"
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        {courtCase?.status ? (
                          <CourtStatusBadge status={courtCase.status} />
                        ) : null}
                        <span className="text-xs text-muted">
                          Opened {courtCase?.opened ?? "—"}
                        </span>
                      </div>
                    </Surface>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <StageDataTile
                        title="Evidence"
                        description="Items submitted"
                        value={String(
                          courtCase?.proceedings.evidence.length ?? 0,
                        )}
                      />
                      <StageDataTile
                        title="Reports"
                        description="Submitted reports"
                        value={String(courtCase?.reports ?? 0)}
                      />
                      <StageDataTile
                        title="Session"
                        description="Court status"
                        value={
                          courtCase?.status === "jury"
                            ? "Jury forming"
                            : courtCase?.status === "live"
                              ? "Live"
                              : "Ended"
                        }
                        tone={courtCase?.status === "live" ? "ok" : undefined}
                      />
                    </div>

                    <Surface
                      variant="panelAlt"
                      radius="2xl"
                      shadow="tile"
                      className="px-5 py-4"
                    >
                      <p className="text-xs font-semibold text-muted">
                        Claim excerpt
                      </p>
                      <p className="mt-2 line-clamp-4 text-sm text-text">
                        {courtCase?.proceedings.claim ?? "—"}
                      </p>
                    </Surface>
                  </div>
                ) : item.stage === "thread" ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-text">
                      Thread snapshot
                    </p>

                    <Surface
                      variant="panelAlt"
                      radius="2xl"
                      shadow="tile"
                      className="space-y-2 px-5 py-4"
                    >
                      <p className="text-xs font-semibold text-muted">
                        Context
                      </p>
                      <p className="text-sm font-semibold text-text">
                        {item.meta.replace(/\s*·\s*Thread\s*$/i, "")}
                      </p>
                      <p className="mt-1 text-sm text-muted">{item.summary}</p>
                    </Surface>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <StageDataTile
                        title="Type"
                        description="Where it lives"
                        value={
                          item.href?.includes("/app/chambers/")
                            ? "Chamber thread"
                            : item.href?.includes("/app/factions/")
                              ? "Faction thread"
                              : "Thread"
                        }
                      />
                      <StageDataTile
                        title="Activity"
                        description="Latest"
                        value={
                          typeof item.summary === "string" &&
                          item.summary.toLowerCase().includes("new replies")
                            ? "New replies"
                            : "Update"
                        }
                      />
                      <StageDataTile
                        title="Updated"
                        description="Feed timestamp"
                        value={formatDate(item.timestamp)}
                      />
                    </div>
                  </div>
                ) : item.stageData ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">
                      Stage data
                    </p>
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
                  </div>
                ) : null}

                {item.stats &&
                item.stage !== "courts" &&
                item.stage !== "thread" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text">Key stats</p>
                    <ul className="grid gap-2 text-sm text-text md:grid-cols-2">
                      {item.stats.map((stat) => (
                        <DashedStatItem
                          key={stat.label}
                          label={stat.label}
                          value={stat.value}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}

                <CardActionsRow
                  proposer={item.proposer}
                  proposerId={item.proposerId}
                  primaryHref={hrefFor(item.href)}
                  primaryLabel={item.ctaPrimary}
                />
              </section>
            </ExpandableCard>
          );
        })}
      </section>
    </div>
  );
};

export default Feed;

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { Button } from "@/components/primitives/button";
import {
  ProposalInvisionInsightCard,
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
  ProposalTimelineCard,
} from "@/components/ProposalSections";
import {
  apiFormationJoin,
  apiFormationMilestoneRequestUnlock,
  apiFormationMilestoneSubmit,
  apiProposalFormationPage,
  apiProposalTimeline,
} from "@/lib/apiClient";
import { useAuth } from "@/app/auth/AuthContext";
import type {
  FormationProposalPageDto,
  ProposalTimelineItemDto,
} from "@/types/api";

const ProposalFormation: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<FormationProposalPageDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          apiProposalFormationPage(id),
          apiProposalTimeline(id),
        ]);
        if (!active) return;
        if (pageResult.status === "fulfilled") {
          setProject(pageResult.value);
          setLoadError(null);
        } else {
          setProject(null);
          setLoadError(pageResult.reason?.message ?? "Failed to load proposal");
        }
        if (timelineResult.status === "fulfilled") {
          setTimeline(timelineResult.value.items);
          setTimelineError(null);
        } else {
          setTimeline([]);
          setTimelineError(
            timelineResult.reason?.message ?? "Failed to load timeline",
          );
        }
      } catch (error) {
        if (!active) return;
        setProject(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (!project) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="proposals" />
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {loadError
            ? `Proposal unavailable: ${loadError}`
            : "Loading proposal…"}
        </Surface>
      </div>
    );
  }

  const parseRatio = (value: string): { filled: number; total: number } => {
    const parts = value.split("/").map((p) => p.trim());
    if (parts.length !== 2) return { filled: 0, total: 0 };
    const filled = Number(parts[0]);
    const total = Number(parts[1]);
    return {
      filled: Number.isFinite(filled) ? filled : 0,
      total: Number.isFinite(total) ? total : 0,
    };
  };

  const milestones = parseRatio(project.milestones);
  const nextMilestone =
    milestones.total > 0 ? milestones.filled + 1 : undefined;

  const runAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    setActionBusy(true);
    try {
      await fn();
      if (id) {
        const next = await apiProposalFormationPage(id);
        setProject(next);
      }
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <ProposalPageHeader
        title={project.title}
        stage="formation"
        chamber={project.chamber}
        proposer={project.proposer}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Formation actions</h2>
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="space-y-3 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              size="lg"
              disabled={!auth.authenticated || !auth.eligible || actionBusy}
              onClick={() =>
                void runAction(async () => {
                  if (!id) return;
                  await apiFormationJoin({ proposalId: id });
                })
              }
            >
              Join project
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={
                !auth.authenticated ||
                !auth.eligible ||
                actionBusy ||
                !nextMilestone ||
                nextMilestone > milestones.total
              }
              onClick={() =>
                void runAction(async () => {
                  if (!id || !nextMilestone) return;
                  await apiFormationMilestoneSubmit({
                    proposalId: id,
                    milestoneIndex: nextMilestone,
                  });
                })
              }
            >
              Submit M{nextMilestone ?? "—"}
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={
                !auth.authenticated ||
                !auth.eligible ||
                actionBusy ||
                !nextMilestone ||
                nextMilestone > milestones.total
              }
              onClick={() =>
                void runAction(async () => {
                  if (!id || !nextMilestone) return;
                  await apiFormationMilestoneRequestUnlock({
                    proposalId: id,
                    milestoneIndex: nextMilestone,
                  });
                })
              }
            >
              Unlock M{nextMilestone ?? "—"}
            </Button>
          </div>

          {!auth.authenticated ? (
            <p className="text-xs text-muted">Connect a wallet to act.</p>
          ) : auth.authenticated && !auth.eligible ? (
            <p className="text-xs text-muted">
              Wallet is connected, but not active (gated).
            </p>
          ) : null}

          {actionError ? (
            <p className="text-xs text-muted" role="status">
              {actionError}
            </p>
          ) : null}
        </Surface>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Project status</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {project.stageData.map((entry) => (
            <Surface
              key={entry.title}
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="p-4"
            >
              <p className="text-sm font-semibold text-muted">{entry.title}</p>
              <p className="text-xs text-muted">{entry.description}</p>
              <p className="text-lg font-semibold text-text">{entry.value}</p>
            </Surface>
          ))}
        </div>
      </section>

      <ProposalSummaryCard
        summary={project.summary}
        stats={[
          { label: "Budget ask", value: project.budget },
          { label: "Time left", value: project.timeLeft },
          { label: "Team slots", value: project.teamSlots },
          { label: "Milestones", value: project.milestones },
        ]}
        overview={project.overview}
        executionPlan={project.executionPlan}
        budgetScope={project.budgetScope}
        attachments={project.attachments}
      />

      <ProposalTeamMilestonesCard
        teamLocked={project.lockedTeam}
        openSlots={project.openSlots}
        milestonesDetail={project.milestonesDetail}
      />

      <ProposalInvisionInsightCard insight={project.invisionInsight} />

      {timelineError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Timeline unavailable: {timelineError}
        </Surface>
      ) : (
        <ProposalTimelineCard items={timeline} />
      )}
    </div>
  );
};

export default ProposalFormation;

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import ProposalStageBar from "@/components/ProposalStageBar";
import { Surface } from "@/components/Surface";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import {
  ProposalInvisionInsightCard,
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
} from "@/components/ProposalSections";
import { apiProposalFormationPage } from "@/lib/apiClient";
import type { FormationProposalPageDto } from "@/types/api";

const ProposalFormation: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<FormationProposalPageDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const page = await apiProposalFormationPage(id);
        if (!active) return;
        setProject(page);
        setLoadError(null);
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

  const renderStageBar = (
    current: "draft" | "pool" | "chamber" | "formation",
  ) => <ProposalStageBar current={current} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <section className="space-y-4">
        <h1 className="text-center text-2xl font-semibold text-text">
          {project.title}
        </h1>
        {renderStageBar("formation")}
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            label="Chamber"
            value={project.chamber}
            radius="2xl"
            className="px-4 py-4"
            labelClassName="text-[0.8rem]"
            valueClassName="text-2xl"
          />
          <StatTile
            label="Proposer"
            value={project.proposer}
            radius="2xl"
            className="px-4 py-4"
            labelClassName="text-[0.8rem]"
            valueClassName="text-2xl"
          />
        </div>
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
    </div>
  );
};

export default ProposalFormation;

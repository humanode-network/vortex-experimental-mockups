import type { ReactNode } from "react";

import {
  AttachmentList,
  type AttachmentItem,
} from "@/components/AttachmentList";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import { TitledSurface } from "@/components/TitledSurface";

export type ProposalSummaryStat = {
  label: string;
  value: ReactNode;
};

export type ProposalTeamMember = {
  name: string;
  role: string;
};

export type ProposalOpenSlot = {
  title: string;
  desc: string;
};

export type ProposalMilestoneDetail = {
  title: string;
  desc: string;
};

export type ProposalInvisionInsight = {
  role: string;
  bullets: string[];
};

export type ProposalTimelineItem = {
  id: string;
  timestamp: string;
  title: string;
  detail?: string;
  actor?: string;
};

type ProposalSummaryCardProps = {
  summary: string;
  stats: ProposalSummaryStat[];
  overview: string;
  executionPlan: string[];
  budgetScope: string;
  attachments: AttachmentItem[];
};

export function ProposalSummaryCard({
  summary,
  stats,
  overview,
  executionPlan,
  budgetScope,
  attachments,
}: ProposalSummaryCardProps) {
  const normalizedSummary = summary.replace(/\s+/g, " ").trim();
  const normalizedOverview = overview.replace(/\s+/g, " ").trim();
  const showSummary = normalizedSummary !== normalizedOverview;

  return (
    <section className="space-y-3 text-sm text-muted">
      <h2 className="text-lg font-semibold text-text">Summary</h2>
      {showSummary && <p>{summary}</p>}
      {stats.length > 0 && (
        <div className="grid gap-2 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <StatTile
              key={item.label}
              label={item.label}
              value={item.value}
              className="px-3 py-2"
            />
          ))}
        </div>
      )}
      <div className="space-y-4 text-text">
        <TitledSurface title="Proposal overview">
          <p className="text-sm leading-relaxed text-muted">{overview}</p>
        </TitledSurface>
        <TitledSurface title="Execution plan">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {executionPlan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </TitledSurface>
        <TitledSurface title="Budget & scope">
          <p className="text-sm text-muted">{budgetScope}</p>
        </TitledSurface>
        <AttachmentList items={attachments} />
      </div>
    </section>
  );
}

type ProposalTeamMilestonesCardProps = {
  teamLocked: ProposalTeamMember[];
  openSlots: ProposalOpenSlot[];
  milestonesDetail: ProposalMilestoneDetail[];
};

export function ProposalTeamMilestonesCard({
  teamLocked,
  openSlots,
  milestonesDetail,
}: ProposalTeamMilestonesCardProps) {
  return (
    <section className="space-y-4 text-sm text-muted">
      <h2 className="text-lg font-semibold text-text">Team & milestones</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <TitledSurface title="Team (locked)">
          <ul className="space-y-2 text-sm text-muted">
            {teamLocked.map((member) => (
              <Surface
                key={member.name}
                as="li"
                variant="panel"
                radius="xl"
                shadow="control"
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="font-semibold text-text">{member.name}</span>
                <span className="text-xs text-muted">{member.role}</span>
              </Surface>
            ))}
            {teamLocked.length === 0 && (
              <Surface
                as="li"
                variant="panel"
                radius="xl"
                borderStyle="dashed"
                className="px-3 py-3 text-center text-xs text-muted"
              >
                No locked team members yet.
              </Surface>
            )}
          </ul>
        </TitledSurface>

        <TitledSurface title="Open slots (positions)">
          <ul className="space-y-2 text-sm text-muted">
            {openSlots.map((slot) => (
              <Surface
                key={slot.title}
                as="li"
                variant="panel"
                radius="xl"
                shadow="control"
                className="px-3 py-2"
              >
                <p className="font-semibold text-text">{slot.title}</p>
                <p className="text-xs text-muted">{slot.desc}</p>
              </Surface>
            ))}
            {openSlots.length === 0 && (
              <Surface
                as="li"
                variant="panel"
                radius="xl"
                borderStyle="dashed"
                className="px-3 py-3 text-center text-xs text-muted"
              >
                No open slots.
              </Surface>
            )}
          </ul>
        </TitledSurface>
      </div>

      <TitledSurface title="Milestones">
        <ul className="space-y-2 text-sm text-muted">
          {milestonesDetail.map((ms) => (
            <Surface
              key={ms.title}
              as="li"
              variant="panel"
              radius="xl"
              shadow="control"
              className="px-3 py-2"
            >
              <p className="font-semibold text-text">{ms.title}</p>
              <p className="text-xs text-muted">{ms.desc}</p>
            </Surface>
          ))}
          {milestonesDetail.length === 0 && (
            <Surface
              as="li"
              variant="panel"
              radius="xl"
              borderStyle="dashed"
              className="px-3 py-3 text-center text-xs text-muted"
            >
              No milestones defined yet.
            </Surface>
          )}
        </ul>
      </TitledSurface>
    </section>
  );
}

type ProposalInvisionInsightCardProps = {
  insight: ProposalInvisionInsight;
};

export function ProposalInvisionInsightCard({
  insight,
}: ProposalInvisionInsightCardProps) {
  return (
    <section className="space-y-3 text-sm text-text">
      <h2 className="text-lg font-semibold text-text">Invision insight</h2>
      <p className="text-sm font-semibold text-text">Role: {insight.role}</p>
      <ul className="list-disc space-y-2 pl-5 text-muted">
        {insight.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

type ProposalTimelineCardProps = {
  items: ProposalTimelineItem[];
};

export function ProposalTimelineCard({ items }: ProposalTimelineCardProps) {
  return (
    <section className="space-y-3 text-sm text-text">
      <h2 className="text-lg font-semibold text-text">Timeline</h2>
      <ul className="space-y-2 text-sm text-muted">
        {items.map((item) => (
          <Surface
            key={item.id}
            as="li"
            variant="panel"
            radius="xl"
            shadow="control"
            className="space-y-1 px-3 py-2"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-semibold text-text">{item.title}</p>
              <p className="text-xs text-muted">{item.timestamp}</p>
            </div>
            {item.detail ? (
              <p className="text-xs text-muted">{item.detail}</p>
            ) : null}
            {item.actor ? (
              <p className="text-xs text-muted">Actor: {item.actor}</p>
            ) : null}
          </Surface>
        ))}
        {items.length === 0 && (
          <Surface
            as="li"
            variant="panel"
            radius="xl"
            borderStyle="dashed"
            className="px-3 py-3 text-center text-xs text-muted"
          >
            No events yet.
          </Surface>
        )}
      </ul>
    </section>
  );
}

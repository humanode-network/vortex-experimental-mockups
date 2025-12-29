import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { HintLabel } from "@/components/Hint";
import {
  stageChipKindForStage,
  stageLabelForStage,
  type Stage,
  type StageChipKind,
} from "@/types/stages";

const chipClasses: Record<StageChipKind, string> = {
  proposal_pool: "bg-[color:var(--accent-warm)]/15 text-[var(--accent-warm)]",
  chamber_vote: "bg-[color:var(--accent)]/15 text-[var(--accent)]",
  formation: "bg-[color:var(--primary)]/12 text-primary",
  thread: "bg-panel-alt text-muted",
  courts: "bg-[color:var(--accent-warm)]/15 text-[var(--accent-warm)]",
  faction: "bg-panel-alt text-muted",
  draft: "bg-panel-alt text-muted",
  final: "bg-[color:var(--accent)]/15 text-[var(--accent)]",
  archived: "bg-panel-alt text-muted",
};

const hintByKind: Partial<Record<StageChipKind, string>> = {
  proposal_pool: "proposal_pools",
  chamber_vote: "chamber_vote",
  formation: "formation",
};

type StageChipProps = {
  stage: Stage;
  label?: ReactNode;
  className?: string;
};

export function StageChip({ stage, label, className }: StageChipProps) {
  const kind: StageChipKind = stageChipKindForStage(stage);
  const termId = hintByKind[kind];
  const content = label ?? stageLabelForStage(stage);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        chipClasses[kind],
        className,
      )}
    >
      {termId ? <HintLabel termId={termId}>{content}</HintLabel> : content}
    </span>
  );
}

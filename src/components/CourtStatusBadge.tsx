import { cn } from "@/lib/utils";
import { Badge } from "@/components/primitives/badge";
import type { CourtCaseStatusDto } from "@/types/api";

const statusClasses: Record<CourtCaseStatusDto, string> = {
  jury: "bg-[color:var(--accent)]/15 text-[var(--accent)]",
  live: "bg-[color:var(--pagehint)]/15 text-[color:var(--pagehint)]",
  ended: "bg-panel-alt text-muted",
};

const statusLabels: Record<CourtCaseStatusDto, string> = {
  jury: "Jury forming",
  live: "Session live",
  ended: "Ended",
};

type CourtStatusBadgeProps = {
  status: CourtCaseStatusDto;
  className?: string;
};

export function CourtStatusBadge({ status, className }: CourtStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusClasses[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}

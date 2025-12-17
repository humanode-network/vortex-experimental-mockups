import { cn } from "@/lib/utils";
import { Badge } from "@/components/primitives/badge";
import type { CourtCase } from "@/data/mock/types";

const statusClasses: Record<CourtCase["status"], string> = {
  jury: "bg-[color:var(--accent)]/15 text-[var(--accent)]",
  deliberating: "bg-[color:var(--accent-warm)]/15 text-[var(--accent-warm)]",
  closed: "bg-panel-alt text-muted",
};

const statusLabels: Record<CourtCase["status"], string> = {
  jury: "Jury forming",
  deliberating: "Deliberating",
  closed: "Closed",
};

type CourtStatusBadgeProps = {
  status: CourtCase["status"];
  className?: string;
};

export function CourtStatusBadge({ status, className }: CourtStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusClasses[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}

export default CourtStatusBadge;

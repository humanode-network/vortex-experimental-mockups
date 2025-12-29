import type { ReactNode } from "react";

import { ChevronDown } from "lucide-react";

import { Card } from "@/components/primitives/card";
import { Kicker } from "@/components/Kicker";
import { cn } from "@/lib/utils";

type ExpandableCardProps = {
  expanded: boolean;
  onToggle: () => void;
  meta?: ReactNode;
  title: ReactNode;
  right: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ExpandableCard({
  expanded,
  onToggle,
  meta,
  title,
  right,
  children,
  className,
}: ExpandableCardProps) {
  return (
    <Card
      className={cn("overflow-hidden border border-border bg-panel", className)}
    >
      <button
        type="button"
        className="flex w-full flex-col gap-4 px-5 py-4 text-left transition hover:bg-panel-alt sm:flex-row sm:items-center sm:justify-between"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <div className={cn(meta ? "space-y-1" : undefined)}>
          {meta ? <Kicker>{meta}</Kicker> : null}
          <p className="text-lg font-semibold text-text">{title}</p>
        </div>
        <div className="flex flex-col gap-2 text-right sm:flex-row sm:items-center sm:gap-3">
          {right}
          <ChevronDown
            className={cn(
              "ml-auto h-5 w-5 text-muted transition-transform sm:ml-0",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {expanded ? (
        <div className="space-y-5 border-t border-border px-5 py-5">
          {children}
        </div>
      ) : null}
    </Card>
  );
}

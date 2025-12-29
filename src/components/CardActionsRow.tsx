import type { ReactNode } from "react";

import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type CardActionsRowProps = {
  proposer?: string;
  proposerId?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryLabel?: ReactNode;
  secondaryVariant?: "ghost" | "outline" | "primary";
  className?: string;
};

export function CardActionsRow({
  proposer,
  proposerId,
  primaryHref,
  primaryLabel,
  secondaryLabel,
  secondaryVariant = "ghost",
  className,
}: CardActionsRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      {proposer && proposerId ? (
        <Link
          to={`/app/human-nodes/${proposerId}`}
          className="text-sm font-semibold text-primary"
        >
          Proposer: {proposer}
        </Link>
      ) : (
        <span className="text-sm text-muted"> </span>
      )}
      <div className="flex flex-wrap gap-2">
        {primaryHref && primaryLabel ? (
          <Button asChild size="sm">
            <Link to={primaryHref}>{primaryLabel}</Link>
          </Button>
        ) : null}
        {secondaryLabel ? (
          <Button size="sm" variant={secondaryVariant}>
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

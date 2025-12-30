import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";

type StageDataTileProps = {
  title: ReactNode;
  description: ReactNode;
  value: ReactNode;
  tone?: "ok" | "warn";
  className?: string;
};

export function StageDataTile({
  title,
  description,
  value,
  tone,
  className,
}: StageDataTileProps) {
  return (
    <Surface
      variant="panelAlt"
      radius="xl"
      shadow="tile"
      className={cn("p-4", className)}
    >
      <p className="text-sm font-semibold text-muted">{title}</p>
      <p className="text-xs text-muted">{description}</p>
      <p
        className={cn(
          "text-lg font-semibold text-text",
          tone === "ok" && "text-accent",
          tone === "warn" && "text-accent-warm",
        )}
      >
        {value}
      </p>
    </Surface>
  );
}

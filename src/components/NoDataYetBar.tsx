import type { ReactNode } from "react";

import { Surface } from "@/components/Surface";
import { cn } from "@/lib/utils";

export function NoDataYetBar(props: {
  label: string;
  description?: ReactNode;
  className?: string;
}): ReactNode {
  const { label, description, className } = props;
  return (
    <Surface
      variant="panelAlt"
      radius="2xl"
      shadow="tile"
      borderStyle="dashed"
      role="status"
      className={cn(
        "flex flex-col gap-1 px-5 py-4 text-sm text-text",
        className,
      )}
    >
      <p className="font-semibold">{`No ${label} yet.`}</p>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </Surface>
  );
}

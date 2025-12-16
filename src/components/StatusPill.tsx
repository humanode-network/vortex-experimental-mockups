import * as React from "react";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";

type StatusPillProps = {
  label: string;
  value: string;
  active?: boolean;
  className?: string;
  widthClassName?: string;
};

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  value,
  active,
  className,
  widthClassName = "w-48",
}) => {
  return (
    <Surface
      variant="panelAlt"
      radius="full"
      shadow="control"
      className={cn(
        "inline-flex items-center justify-between px-4 py-2",
        widthClassName,
        className,
      )}
    >
      <span className="text-xs tracking-wide text-muted uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-semibold",
          active === true
            ? "text-primary"
            : active === false
              ? "text-muted"
              : "",
        )}
      >
        {value}
      </span>
    </Surface>
  );
};

export default StatusPill;

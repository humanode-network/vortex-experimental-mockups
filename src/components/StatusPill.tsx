import * as React from "react";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";
import { Kicker } from "@/components/Kicker";

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
      <Kicker as="span">{label}</Kicker>
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

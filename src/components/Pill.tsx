import * as React from "react";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";

type PillProps = {
  as?: React.ElementType;
  variant?: "panel" | "panelAlt";
  tone?: "muted" | "primary" | "default";
  size?: "xs" | "sm";
  className?: string;
  children: React.ReactNode;
} & Record<string, unknown>;

const sizeClass: Record<NonNullable<PillProps["size"]>, string> = {
  xs: "px-2 py-0.5 text-[0.7rem]",
  sm: "px-2 py-1 text-[0.75rem]",
};

export const Pill: React.FC<PillProps> = ({
  as = "span",
  variant = "panel",
  tone = "muted",
  size = "xs",
  className,
  children,
  ...rest
}) => {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "default"
        ? "text-text"
        : "text-muted";

  return (
    <Surface
      as={as}
      variant={variant}
      radius="full"
      shadow="control"
      className={cn(
        "border border-border tracking-wide",
        sizeClass[size],
        toneClass,
        className,
      )}
      {...(rest as any)}
    >
      {children}
    </Surface>
  );
};

export default Pill;

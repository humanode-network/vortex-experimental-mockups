import * as React from "react";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";
import { Kicker } from "@/components/Kicker";

type StatTileProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  align?: "center" | "left";
  radius?: "xl" | "2xl";
  variant?: "panel" | "panelAlt";
};

/**
 * Small reusable KPI tile used across pages.
 * Keeps border/bg/shadow/ring centralized via `Surface`.
 */
export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
  align = "center",
  radius = "xl",
  variant = "panelAlt",
}) => {
  const alignClasses = align === "left" ? "text-left" : "text-center";
  return (
    <Surface
      variant={variant}
      radius={radius}
      shadow="tile"
      className={cn("px-3 py-3", alignClasses, className)}
    >
      <Kicker
        align={align === "left" ? "left" : "center"}
        className={cn("text-[0.7rem]", labelClassName)}
      >
        {label}
      </Kicker>
      <p className={cn("text-base font-semibold text-text", valueClassName)}>
        {value}
      </p>
    </Surface>
  );
};

import React from "react";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/Surface";

type MetricTileProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
};

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  className,
}) => {
  return (
    <Surface
      variant="panelAlt"
      radius="2xl"
      shadow="tile"
      className={cn("px-4 py-5 text-center", className)}
    >
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="text-2xl font-semibold text-text">{value}</p>
    </Surface>
  );
};

export default MetricTile;

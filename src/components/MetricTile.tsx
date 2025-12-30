import React from "react";
import { cn } from "@/lib/utils";
import { StatTile } from "@/components/StatTile";

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
    <StatTile
      label={label}
      value={value}
      radius="2xl"
      align="center"
      variant="panelAlt"
      className={cn("px-4 py-5", className)}
      valueClassName="text-2xl"
    />
  );
};

export default MetricTile;

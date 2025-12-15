import React from "react";
import { cn } from "@/lib/utils";

type MetricTileProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
};

const singleTileClass =
  "border border-border bg-panel text-text shadow-[var(--shadow-tile)] [background-image:var(--card-grad)]";

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-5 text-center",
        singleTileClass,
        className,
      )}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
};

export default MetricTile;

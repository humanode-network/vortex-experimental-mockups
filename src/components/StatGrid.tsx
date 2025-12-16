import React from "react";
import { HintLabel } from "@/components/Hint";

type StatItem = {
  label: React.ReactNode;
  value: string | number;
  tone?: "neutral" | "primary" | "cool" | "warm";
};

type StatGridProps = {
  items: StatItem[];
};

const tileClass =
  "flex flex-col items-center rounded-xl border bg-panel-alt px-3 py-2 text-center text-text shadow-[var(--shadow-tile)] ring-1 ring-inset ring-[color:var(--glass-border)] bg-cover bg-no-repeat";

export const StatGrid: React.FC<StatGridProps> = ({ items }) => {
  return (
    <dl className="grid grid-cols-3 gap-3 text-center text-sm text-text">
      {items.map((item) => (
        <div
          key={typeof item.label === "string" ? item.label : `${item.value}`}
          className={tileClass}
          style={{
            backgroundImage:
              item.tone === "primary"
                ? "var(--grad-primary)"
                : item.tone === "cool"
                  ? "var(--grad-cool)"
                  : item.tone === "warm"
                    ? "var(--grad-warm)"
                    : "var(--card-grad)",
          }}
        >
          <dt className="text-center text-[0.65rem] leading-tight tracking-wide whitespace-nowrap text-muted uppercase">
            {item.label}
          </dt>
          <dd className="text-lg font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
};

export const makeChamberStats = (stats: {
  governors: string;
  mcm: string;
  lcm: string;
}): StatItem[] => [
  { label: "Governors", value: stats.governors, tone: "cool" },
  {
    label: <HintLabel termId="acm">ACM</HintLabel>,
    value: stats.mcm,
    tone: "primary",
  },
  {
    label: <HintLabel termId="lcm">LCM</HintLabel>,
    value: stats.lcm,
    tone: "warm",
  },
];

export default StatGrid;

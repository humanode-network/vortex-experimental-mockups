import React from "react";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";
import { Kicker } from "@/components/Kicker";

type StatItem = {
  label: React.ReactNode;
  value: string | number;
  tone?: "neutral" | "primary" | "cool" | "warm";
};

type StatGridProps = {
  items: StatItem[];
};

export const StatGrid: React.FC<StatGridProps> = ({ items }) => {
  return (
    <dl className="grid grid-cols-2 gap-3 text-center text-sm text-text">
      {items.map((item) => (
        <Surface
          key={typeof item.label === "string" ? item.label : `${item.value}`}
          variant="panelAlt"
          radius="xl"
          shadow="tile"
          className="flex flex-col items-center px-3 py-2 text-center"
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
          <Kicker
            as="dt"
            align="center"
            className="text-[0.65rem] leading-tight whitespace-nowrap"
          >
            {item.label}
          </Kicker>
          <dd className="text-lg font-semibold">{item.value}</dd>
        </Surface>
      ))}
    </dl>
  );
};

export const makeChamberStats = (stats: {
  governors: string;
  acm: string;
  mcm: string;
  lcm: string;
}): StatItem[] => [
  {
    label: <HintLabel termId="acm">ACM</HintLabel>,
    value: stats.acm,
    tone: "primary",
  },
  {
    label: <HintLabel termId="mcm">MCM</HintLabel>,
    value: stats.mcm,
    tone: "cool",
  },
  {
    label: <HintLabel termId="lcm">LCM</HintLabel>,
    value: stats.lcm,
    tone: "warm",
  },
  { label: "Governors", value: stats.governors, tone: "neutral" },
];

export default StatGrid;

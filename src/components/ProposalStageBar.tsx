import React from "react";
import { HintLabel } from "@/components/Hint";

export type ProposalStage = "draft" | "pool" | "chamber" | "formation";

type ProposalStageBarProps = {
  current: ProposalStage;
  className?: string;
};

export const ProposalStageBar: React.FC<ProposalStageBarProps> = ({
  current,
  className,
}) => {
  const stages: {
    key: ProposalStage;
    label: string;
    render?: React.ReactNode;
  }[] = [
    { key: "draft", label: "Draft" },
    {
      key: "pool",
      label: "Proposal pool",
      render: <HintLabel termId="proposal_pools">Proposal pool</HintLabel>,
    },
    {
      key: "chamber",
      label: "Chamber vote",
      render: <HintLabel termId="chamber_vote">Chamber vote</HintLabel>,
    },
    {
      key: "formation",
      label: "Formation",
      render: <HintLabel termId="formation">Formation</HintLabel>,
    },
  ];

  return (
    <div className={["flex gap-2", className].filter(Boolean).join(" ")}>
      {stages.map((stage) => {
        const active = stage.key === current;
        const activeClasses =
          stage.key === "draft"
            ? "bg-panel text-text border border-border shadow-[var(--shadow-control)] ring-1 ring-inset ring-[color:var(--glass-border)]"
            : stage.key === "pool"
              ? "bg-primary text-[var(--primary-foreground)]"
              : stage.key === "chamber"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--accent-warm)] text-[var(--text)]";
        return (
          <div
            key={stage.key}
            className={[
              "flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold transition",
              active
                ? activeClasses
                : "border border-border bg-panel-alt [background-image:var(--card-grad)] bg-cover bg-no-repeat text-muted",
            ].join(" ")}
          >
            {stage.render ?? stage.label}
          </div>
        );
      })}
    </div>
  );
};

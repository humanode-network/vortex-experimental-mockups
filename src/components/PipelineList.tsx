import React from "react";
import { HintLabel } from "@/components/Hint";
import { Surface } from "@/components/Surface";

type Pipeline = {
  pool: number;
  vote: number;
  build: number;
};

type PipelineListProps = {
  pipeline: Pipeline;
};

const badgeClass =
  "rounded-full border border-[var(--accent)] bg-panel px-2 py-0.5 text-[0.8rem] font-semibold text-[var(--accent)]";

export const PipelineList: React.FC<PipelineListProps> = ({ pipeline }) => {
  return (
    <Surface
      variant="panelAlt"
      borderStyle="dashed"
      radius="2xl"
      shadow="tile"
      className="px-3 py-3"
    >
      <ul className="text-sm">
        <li className="flex items-center justify-between border-b border-border/50 pb-2 text-text">
          <span>
            <HintLabel termId="proposal_pools">Proposal pool</HintLabel>
          </span>
          <span className={badgeClass}>{pipeline.pool}</span>
        </li>
        <li className="flex items-center justify-between border-b border-border/50 py-2 text-text">
          <span>
            <HintLabel termId="chamber_vote">Chamber vote</HintLabel>
          </span>
          <span className={badgeClass}>{pipeline.vote}</span>
        </li>
        <li className="flex items-center justify-between pt-2 text-text">
          <span>
            <HintLabel termId="formation">Formation</HintLabel> builds
          </span>
          <span className={badgeClass}>{pipeline.build}</span>
        </li>
      </ul>
    </Surface>
  );
};

export default PipelineList;

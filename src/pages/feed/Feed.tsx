import { useState } from "react";

import { cn } from "@/lib/utils";
import { PageHint } from "@/components/PageHint";
import { CardActionsRow } from "@/components/CardActionsRow";
import { DashedStatItem } from "@/components/DashedStatItem";
import { ExpandableCard } from "@/components/ExpandableCard";
import { StageChip } from "@/components/StageChip";
import { StageDataTile } from "@/components/StageDataTile";
import { feedItems } from "@/data/mock/feed";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${day}/${month}/${year} · ${time}`;
};

const Feed: React.FC = () => {
  const sortedFeed = [...feedItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((curr) => (curr === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHint pageId="feed" />
      {/* Governing threshold moved to MyGovernance */}

      <section aria-live="polite" className="flex flex-col gap-4">
        {sortedFeed.map((item, index) => (
          <ExpandableCard
            key={item.id}
            expanded={expanded === item.id}
            onToggle={() => toggle(item.id)}
            className={cn(index < 3 ? "border-primary" : "border-border")}
            meta={formatDate(item.timestamp)}
            title={item.title}
            right={
              <>
                <StageChip stage={item.stage} />
              </>
            }
          >
            <p className="text-sm text-muted">{item.summary}</p>

            {item.stageData ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {item.stageData.map((entry) => (
                  <StageDataTile
                    key={entry.title}
                    title={entry.title}
                    description={entry.description}
                    value={entry.value}
                    tone={entry.tone}
                  />
                ))}
              </div>
            ) : null}

            {item.stats ? (
              <ul className="grid gap-2 text-sm text-text md:grid-cols-2">
                {item.stats.map((stat) => (
                  <DashedStatItem
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                  />
                ))}
              </ul>
            ) : null}

            <CardActionsRow
              proposer={item.proposer}
              proposerId={item.proposerId}
              primaryHref={`/app${item.href}`}
              primaryLabel={item.ctaPrimary}
            />
          </ExpandableCard>
        ))}
      </section>
    </div>
  );
};

export default Feed;

import { HintLabel } from "@/components/Hint";
import { PageHint } from "@/components/PageHint";
import { SearchBar } from "@/components/SearchBar";
import { useMemo, useState } from "react";
import MetricTile from "@/components/MetricTile";
import AppCard from "@/components/AppCard";
import { Badge } from "@/components/primitives/badge";
import StatGrid, { makeChamberStats } from "@/components/StatGrid";
import PipelineList from "@/components/PipelineList";
import { Button } from "@/components/primitives/button";
import { Link } from "react-router";
import { chambers } from "@/data/mock/chambers";

type Metric = {
  label: string;
  value: string;
};

const metricCards: Metric[] = [
  { label: "Total chambers", value: "6" },
  { label: "Active governors", value: "100" },
  { label: "Total ACM", value: "7,600" },
  { label: "Live proposals", value: "9" },
];

const Chambers: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    pipelineFilter: "any" | "pool" | "vote" | "build";
    sortBy: "name" | "governors" | "acm";
  }>({ pipelineFilter: "any", sortBy: "name" });
  const { pipelineFilter, sortBy } = filters;
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...chambers]
      .filter((chamber) => {
        const matchesTerm =
          term.length === 0 ||
          chamber.name.toLowerCase().includes(term) ||
          chamber.stats.governors.toLowerCase().includes(term) ||
          chamber.stats.acm.toLowerCase().includes(term) ||
          chamber.stats.mcm.toLowerCase().includes(term) ||
          chamber.stats.lcm.toLowerCase().includes(term) ||
          String(chamber.multiplier).toLowerCase().includes(term);
        const matchesPipeline =
          pipelineFilter === "any" ||
          chamber.pipeline[pipelineFilter] > 0 ||
          pipelineFilter === "build";
        return matchesTerm && matchesPipeline;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "governors")
          return (
            parseInt(b.stats.governors, 10) - parseInt(a.stats.governors, 10)
          );
        return (
          parseInt(b.stats.acm.replace(/[,]/g, ""), 10) -
          parseInt(a.stats.acm.replace(/[,]/g, ""), 10)
        );
      });
  }, [search, pipelineFilter, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="chambers" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const label =
            metric.label === "Total ACM" ? (
              <>
                <span className="font-normal">Total</span>{" "}
                <HintLabel termId="acm" termText="ACM" />
              </>
            ) : (
              metric.label
            );
          return (
            <MetricTile key={metric.label} label={label} value={metric.value} />
          );
        })}
      </section>

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search chambers by name or stats…"
        ariaLabel="Search chambers"
        inputClassName="bg-[var(--panel-alt)] border border-border text-[var(--text)]"
        filtersConfig={[
          {
            key: "pipelineFilter",
            label: "Pipeline filter",
            options: [
              { value: "any", label: "Any pipeline" },
              { value: "pool", label: "Has proposal pool items" },
              { value: "vote", label: "Has chamber votes" },
              { value: "build", label: "Has Formation builds" },
            ],
          },
          {
            key: "sortBy",
            label: "Sort by",
            options: [
              { value: "name", label: "Name (A–Z)" },
              { value: "governors", label: "Governors (desc)" },
              { value: "acm", label: "ACM (desc)" },
            ],
          },
        ]}
        filtersState={filters}
        onFiltersChange={setFilters}
      />

      <section
        aria-live="polite"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {filtered.map((chamber) => (
          <AppCard
            key={chamber.id}
            title={<span className="text-xl font-bold">{chamber.name}</span>}
            badge={
              <Badge
                size="md"
                className="border-none bg-[var(--primary-dim)] px-4 py-1 text-center text-sm font-bold tracking-wide whitespace-nowrap text-[var(--primary)] uppercase"
              >
                M × {chamber.multiplier}
              </Badge>
            }
            footer={
              <div className="flex w-full justify-center">
                <Button asChild size="md" variant="primary" className="w-56">
                  <Link to={`/chambers/${chamber.id}`}>Enter</Link>
                </Button>
              </div>
            }
          >
            <StatGrid items={makeChamberStats(chamber.stats)} />
            <PipelineList pipeline={chamber.pipeline} />
          </AppCard>
        ))}
      </section>
    </div>
  );
};

export default Chambers;

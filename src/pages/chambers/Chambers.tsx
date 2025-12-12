import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HintLabel } from "@/components/Hint";
import { PageHint } from "@/components/PageHint";
import { SearchBar } from "@/components/SearchBar";
import { useMemo, useState } from "react";

type Metric = {
  label: string;
  value: string;
};

type Chamber = {
  id: string;
  name: string;
  multiplier: string;
  stats: {
    governors: string;
    mcm: string;
    lcm: string;
  };
  pipeline: {
    pool: number;
    vote: number;
    build: number;
  };
};

const metricCards: Metric[] = [
  { label: "Total chambers", value: "6" },
  { label: "Active governors", value: "100" },
  { label: "Total ACM", value: "7,600" },
  { label: "Live proposals", value: "9" },
];

const chambers: Chamber[] = [
  {
    id: "protocol-engineering",
    name: "Protocol Engineering",
    multiplier: "×1.5",
    stats: { governors: "22", mcm: "1,600", lcm: "1,800" },
    pipeline: { pool: 2, vote: 2, build: 1 },
  },
  {
    id: "research-cryptobiometrics",
    name: "Research & Cryptobiometrics",
    multiplier: "×1.8",
    stats: { governors: "15", mcm: "1,200", lcm: "1,400" },
    pipeline: { pool: 2, vote: 1, build: 0 },
  },
  {
    id: "treasury-economics",
    name: "Treasury & Economics",
    multiplier: "×1.3",
    stats: { governors: "18", mcm: "1,400", lcm: "1,550" },
    pipeline: { pool: 2, vote: 2, build: 1 },
  },
  {
    id: "formation-logistics",
    name: "Formation Logistics",
    multiplier: "×1.2",
    stats: { governors: "12", mcm: "900", lcm: "1,000" },
    pipeline: { pool: 1, vote: 0, build: 3 },
  },
  {
    id: "social-outreach",
    name: "Social Outreach",
    multiplier: "×1.1",
    stats: { governors: "10", mcm: "700", lcm: "780" },
    pipeline: { pool: 1, vote: 1, build: 0 },
  },
  {
    id: "security-council",
    name: "Security Council",
    multiplier: "×1.7",
    stats: { governors: "23", mcm: "1,800", lcm: "2,000" },
    pipeline: { pool: 1, vote: 2, build: 1 },
  },
];

const Chambers: React.FC = () => {
  const [search, setSearch] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<
    "any" | "pool" | "vote" | "build"
  >("any");
  const [sortBy, setSortBy] = useState<"name" | "governors" | "acm">("name");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...chambers]
      .filter((chamber) => {
        const matchesTerm =
          term.length === 0 ||
          chamber.name.toLowerCase().includes(term) ||
          chamber.stats.governors.toLowerCase().includes(term) ||
          chamber.stats.mcm.toLowerCase().includes(term) ||
          chamber.stats.lcm.toLowerCase().includes(term) ||
          chamber.multiplier.toLowerCase().includes(term);
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
          parseInt(b.stats.mcm.replace(/[,]/g, ""), 10) -
          parseInt(a.stats.mcm.replace(/[,]/g, ""), 10)
        );
      });
  }, [search, pipelineFilter, sortBy]);

  return (
    <div className="app-page flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <PageHint pageId="chambers" />
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <div
            key={metric.label}
            className="bg-panel-alt rounded-2xl border border-border px-4 py-5 text-center shadow-sm"
          >
            <p className="text-sm text-muted">
              {metric.label === "Total ACM" ? (
                <>
                  <span className="font-normal">Total</span>{" "}
                  <HintLabel termId="acm" termText="ACM" />
                </>
              ) : (
                metric.label
              )}
            </p>
            <p className="text-2xl font-semibold text-(--text)">
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search chambers by name or stats…"
        ariaLabel="Search chambers"
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
        filtersState={{ pipelineFilter, sortBy }}
        onFiltersChange={(next) => {
          if (next.pipelineFilter)
            setPipelineFilter(
              next.pipelineFilter as "any" | "pool" | "vote" | "build",
            );
          if (next.sortBy)
            setSortBy(next.sortBy as "name" | "governors" | "acm");
        }}
      />

      <section
        aria-live="polite"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {filtered.map((chamber) => (
          <Card
            key={chamber.id}
            className="bg-panel h-full border border-border"
          >
            <CardHeader className="pb-0">
              <div className="flex min-h-16 items-start justify-between gap-2">
                <CardTitle className="max-w-[70%] leading-tight">
                  {chamber.name}
                </CardTitle>
                <Badge
                  className="text-center text-xs font-semibold whitespace-nowrap uppercase"
                  variant="outline"
                >
                  M × {chamber.multiplier.replace("×", "").trim()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-3 gap-3 text-center text-sm text-(--text)">
                <div className="bg-panel-alt flex flex-col items-center rounded-xl border border-border px-3 py-2 text-center">
                  <dt className="text-center text-[0.65rem] leading-tight tracking-wide whitespace-nowrap text-muted uppercase">
                    Governors
                  </dt>
                  <dd className="text-lg font-semibold">
                    {chamber.stats.governors}
                  </dd>
                </div>
                <div className="bg-panel-alt flex flex-col items-center rounded-xl border border-border px-3 py-2 text-center">
                  <dt className="text-[0.65rem] leading-tight tracking-normal whitespace-nowrap text-muted normal-case">
                    <HintLabel termId="acm">ACM</HintLabel>
                  </dt>
                  <dd className="text-lg font-semibold">{chamber.stats.mcm}</dd>
                </div>
                <div className="bg-panel-alt flex flex-col items-center rounded-xl border border-border px-3 py-2 text-center">
                  <dt className="text-[0.65rem] leading-tight tracking-normal whitespace-nowrap text-muted normal-case">
                    <HintLabel termId="lcm">LCM</HintLabel>
                  </dt>
                  <dd className="text-lg font-semibold">{chamber.stats.lcm}</dd>
                </div>
              </dl>

              <ul className="bg-panel-alt rounded-2xl border border-dashed border-border/80 px-3 py-3 text-sm">
                <li className="flex items-center justify-between border-b border-border/50 pb-2 text-(--text)">
                  <span>
                    <HintLabel termId="proposal_pools">Proposal pool</HintLabel>
                  </span>
                  <strong>{chamber.pipeline.pool}</strong>
                </li>
                <li className="flex items-center justify-between border-b border-border/50 py-2 text-(--text)">
                  <span>
                    <HintLabel termId="chamber_vote">Chamber vote</HintLabel>
                  </span>
                  <strong>{chamber.pipeline.vote}</strong>
                </li>
                <li className="flex items-center justify-between pt-2 text-(--text)">
                  <span>
                    <HintLabel termId="formation">Formation</HintLabel> builds
                  </span>
                  <strong>{chamber.pipeline.build}</strong>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              <Button asChild size="sm" className="w-full">
                <Link to={`/chambers/${chamber.id}`}>Open chamber</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default Chambers;

import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Category = "all" | "research" | "development" | "social";
type Stage = "live" | "upcoming" | "completed";

type FormationMetric = {
  label: string;
  value: string;
  dataAttr: string;
};

type FormationProject = {
  id: string;
  title: string;
  focus: string;
  proposer: string;
  summary: string;
  category: Category;
  stage: Stage;
  budget: string;
  milestones: string;
  teamSlots: string;
};

const metrics: FormationMetric[] = [
  { label: "Total funded HMND", value: "340k", dataAttr: "metric-hmnd" },
  { label: "Active projects", value: "12", dataAttr: "metric-active" },
  { label: "Open team slots", value: "9", dataAttr: "metric-slots" },
  { label: "Milestones delivered", value: "46", dataAttr: "metric-milestones" },
];

const categoryOptions: { label: string; value: Category }[] = [
  { label: "All", value: "all" },
  { label: "Research", value: "research" },
  { label: "Development & Product", value: "development" },
  { label: "Social Good & Community", value: "social" },
];

const stageLegend: { label: string; value: Stage; dotClass: string }[] = [
  { label: "Live", value: "live", dotClass: "bg-emerald-500" },
  { label: "Upcoming", value: "upcoming", dotClass: "bg-amber-500" },
  { label: "Completed", value: "completed", dotClass: "bg-slate-400" },
];

const projects: FormationProject[] = [
  {
    id: "node-health-kit",
    title: "Node Health Kit",
    focus: "Formation Logistics · Tooling",
    proposer: "JohnDoe",
    summary:
      "Tooling bundle to automate node diagnostics and recovery workflows for operators.",
    category: "development",
    stage: "live",
    budget: "80k HMND",
    milestones: "6 / 9",
    teamSlots: "2 open",
  },
  {
    id: "identity-risk-lab",
    title: "Identity Risk Lab",
    focus: "Research · Upcoming cohort",
    proposer: "Raamara",
    summary:
      "Exploratory track modeling biometric verification attacks and mitigation strategies.",
    category: "research",
    stage: "upcoming",
    budget: "45k HMND",
    milestones: "0 / 5",
    teamSlots: "3 open",
  },
  {
    id: "community-field-unit",
    title: "Community Field Unit",
    focus: "Social Good · Outreach",
    proposer: "Nana",
    summary:
      "Mobile mesh of community ambassadors for onboarding and support coverage.",
    category: "social",
    stage: "live",
    budget: "65k HMND",
    milestones: "4 / 6",
    teamSlots: "1 open",
  },
  {
    id: "deterrence-sim-lab",
    title: "Deterrence Sim Lab",
    focus: "Research · Security",
    proposer: "Victor",
    summary:
      "Scenario simulator for deterrence drills and biometric failure rehearsals.",
    category: "research",
    stage: "completed",
    budget: "50k HMND",
    milestones: "6 / 6",
    teamSlots: "0 open",
  },
];

const Formation: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const searchId = `${useId()}-formation-search`;

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory =
        activeCategory === "all" || project.category === activeCategory;
      const matchesSearch =
        term.length === 0 ||
        project.title.toLowerCase().includes(term) ||
        project.proposer.toLowerCase().includes(term) ||
        project.summary.toLowerCase().includes(term) ||
        project.focus.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <div className="app-page flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-(--text)">Formation</h1>
        <p className="text-sm text-muted">
          Formation programs, squads, and milestone progress.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            data-metric={metric.dataAttr}
            className="bg-panel-alt rounded-2xl border border-border px-4 py-5 shadow-sm"
          >
            <p className="text-sm text-muted">{metric.label}</p>
            <strong className="text-2xl font-semibold text-(--text)">
              {metric.value}
            </strong>
          </article>
        ))}
      </section>

      <section className="bg-panel flex flex-col gap-3 rounded-2xl border border-border p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Formation filters"
        >
          {categoryOptions.map((category) => (
            <Button
              key={category.value}
              type="button"
              role="tab"
              size="sm"
              aria-selected={activeCategory === category.value}
              variant={
                activeCategory === category.value ? "primary" : "outline"
              }
              className="rounded-full px-4"
              onClick={() => setActiveCategory(category.value)}
            >
              {category.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
          {stageLegend.map((stage) => (
            <span key={stage.value} className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${stage.dotClass}`} />
              {stage.label}
            </span>
          ))}
        </div>
      </section>

      <section role="search" className="space-y-2">
        <label
          htmlFor={searchId}
          className="text-xs tracking-wide text-muted uppercase"
        >
          Search projects
        </label>
        <div className="relative">
          <Input
            id={searchId}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project, proposer, focus, stage…"
            autoComplete="off"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full px-2 text-muted"
              onClick={() => setSearch("")}
            >
              ×
            </Button>
          )}
        </div>
      </section>

      <section
        aria-live="polite"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        data-formation-list={filteredProjects.length}
      >
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="bg-panel border border-border shadow-sm"
          >
            <CardHeader className="flex items-center justify-between pb-2">
              <div>
                <p className="text-xs tracking-wide text-muted uppercase">
                  {project.focus}
                </p>
                <h3 className="text-lg font-semibold text-(--text)">
                  {project.title}
                </h3>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {project.stage === "live"
                  ? "Live"
                  : project.stage === "upcoming"
                    ? "Upcoming"
                    : "Completed"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-(--text)">{project.summary}</p>
              <div className="grid gap-2 text-sm text-(--text)">
                <div className="bg-panel-alt rounded-xl border border-border px-3 py-2">
                  <p className="text-xs tracking-wide text-muted uppercase">
                    Budget
                  </p>
                  <p className="font-semibold">{project.budget}</p>
                </div>
                <div className="bg-panel-alt rounded-xl border border-border px-3 py-2">
                  <p className="text-xs tracking-wide text-muted uppercase">
                    Milestones
                  </p>
                  <p className="font-semibold">{project.milestones}</p>
                </div>
                <div className="bg-panel-alt rounded-xl border border-border px-3 py-2">
                  <p className="text-xs tracking-wide text-muted uppercase">
                    Team slots
                  </p>
                  <p className="font-semibold">{project.teamSlots}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span>
                  Proposer:{" "}
                  <span className="font-semibold text-(--text) hover:text-primary">
                    {project.proposer}
                  </span>
                </span>
                <Button size="sm">Open project</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredProjects.length === 0 && (
          <div className="bg-panel rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted md:col-span-2 xl:col-span-3">
            No Formation projects match the current filters.
          </div>
        )}
      </section>
    </div>
  );
};

export default Formation;

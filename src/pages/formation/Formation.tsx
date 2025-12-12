import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
import { PageHint } from "@/components/PageHint";
import { SearchBar } from "@/components/SearchBar";

type Category = "all" | "research" | "development" | "social";
type Stage = "live" | "gathering" | "completed";

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

const stageLabel: Record<Stage, string> = {
  live: "Live",
  gathering: "Gathering team",
  completed: "Completed",
};

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
    stage: "gathering",
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
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "any">("any");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        term.length === 0 ||
        project.title.toLowerCase().includes(term) ||
        project.proposer.toLowerCase().includes(term) ||
        project.summary.toLowerCase().includes(term) ||
        project.focus.toLowerCase().includes(term);
      const matchesStage =
        stageFilter === "any" ? true : project.stage === stageFilter;
      const matchesCategory =
        categoryFilter === "all" ? true : project.category === categoryFilter;
      return matchesSearch && matchesStage && matchesCategory;
    });
  }, [search, stageFilter, categoryFilter]);

  return (
    <div className="app-page flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-(--text)">Formation</h1>
          <p className="text-sm text-muted">
            Formation programs, squads, and milestone progress.
          </p>
        </div>
        <PageHint pageId="formation" />
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

      <section role="search" className="space-y-2">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by project, proposer, focus, stage…"
          ariaLabel="Search projects"
          inputClassName="w-full"
          filtersConfig={[
            {
              key: "stageFilter",
              label: "Stage",
              options: [
                { value: "any", label: "Any stage" },
                { value: "live", label: "Live" },
                { value: "gathering", label: "Gathering team" },
                { value: "completed", label: "Completed" },
              ],
            },
            {
              key: "categoryFilter",
              label: "Category",
              options: [
                { value: "all", label: "All focuses" },
                { value: "research", label: "Research" },
                { value: "development", label: "Development & Product" },
                { value: "social", label: "Social Good & Community" },
              ],
            },
          ]}
          filtersState={{ stageFilter, categoryFilter }}
          onFiltersChange={(next) => {
            if (next.stageFilter)
              setStageFilter(next.stageFilter as Stage | "any");
            if (next.categoryFilter)
              setCategoryFilter(next.categoryFilter as Category | "all");
          }}
        />
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
                {stageLabel[project.stage]}
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
                <Button asChild size="sm">
                  <Link to={`/proposals/${project.id ?? "project"}/formation`}>
                    Open project
                  </Link>
                </Button>
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

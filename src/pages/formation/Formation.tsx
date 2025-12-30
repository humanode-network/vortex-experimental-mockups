import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Link } from "react-router";
import { SearchBar } from "@/components/SearchBar";
import { MetricTile } from "@/components/MetricTile";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { apiFormation } from "@/lib/apiClient";
import type {
  FormationCategoryDto as Category,
  FormationProjectDto,
  FormationStageDto as Stage,
  GetFormationResponse,
} from "@/types/api";

const stageLabel: Record<Stage, string> = {
  live: "Live",
  gathering: "Gathering team",
  completed: "Completed",
};

const Formation: React.FC = () => {
  const [data, setData] = useState<GetFormationResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    stageFilter: Stage | "any";
    categoryFilter: Category;
  }>({ stageFilter: "any", categoryFilter: "all" });
  const { stageFilter, categoryFilter } = filters;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFormation();
        if (!active) return;
        setData(res);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setData({ metrics: [], projects: [] });
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const projects: FormationProjectDto[] = data?.projects ?? [];
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
  }, [projects, search, stageFilter, categoryFilter]);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="formation" />
      {data === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading Formation…
        </Card>
      ) : null}
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          Formation unavailable: {loadError}
        </Card>
      ) : null}
      {data !== null && projects.length === 0 && !loadError ? (
        <NoDataYetBar label="Formation projects" />
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.metrics ?? []).map((metric) => (
          <div
            key={metric.label}
            data-metric={metric.dataAttr}
            className="contents"
          >
            <MetricTile
              label={metric.label}
              value={metric.value}
              className="px-4 py-5"
            />
          </div>
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
          filtersState={filters}
          onFiltersChange={setFilters}
        />
      </section>

      <section
        aria-live="polite"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        data-formation-list={filteredProjects.length}
      >
        {filteredProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="flex items-center justify-between pb-2">
              <div>
                <Kicker>{project.focus}</Kicker>
                <h3 className="text-lg font-semibold text-text">
                  {project.title}
                </h3>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {stageLabel[project.stage]}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-text">{project.summary}</p>
              <div className="grid gap-2 text-sm text-text">
                <Surface
                  variant="panelAlt"
                  radius="xl"
                  shadow="control"
                  className="px-3 py-2"
                >
                  <Kicker>Budget</Kicker>
                  <p className="font-semibold">{project.budget}</p>
                </Surface>
                <Surface
                  variant="panelAlt"
                  radius="xl"
                  shadow="control"
                  className="px-3 py-2"
                >
                  <Kicker>Milestones</Kicker>
                  <p className="font-semibold">{project.milestones}</p>
                </Surface>
                <Surface
                  variant="panelAlt"
                  radius="xl"
                  shadow="control"
                  className="px-3 py-2"
                >
                  <Kicker>Team slots</Kicker>
                  <p className="font-semibold">{project.teamSlots}</p>
                </Surface>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span>
                  Proposer:{" "}
                  <span className="font-semibold text-text hover:text-primary">
                    {project.proposer}
                  </span>
                </span>
                <Button asChild size="sm">
                  <Link
                    to={`/app/proposals/${project.id ?? "project"}/formation`}
                  >
                    Open project
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.length > 0 && filteredProjects.length === 0 && (
          <Surface
            variant="panel"
            borderStyle="dashed"
            className="px-4 py-8 text-center text-sm text-muted md:col-span-2 xl:col-span-3"
          >
            No Formation projects match the current filters.
          </Surface>
        )}
      </section>
    </div>
  );
};

export default Formation;

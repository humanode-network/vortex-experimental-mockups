import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/primitives/button";
import { SearchBar } from "@/components/SearchBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Link } from "react-router";
import { MetricTile } from "@/components/MetricTile";
import { CourtStatusBadge } from "@/components/CourtStatusBadge";
import { PageHint } from "@/components/PageHint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { apiCourts } from "@/lib/apiClient";
import type { CourtCaseDto, CourtCaseStatusDto } from "@/types/api";

const Courts: React.FC = () => {
  const [cases, setCases] = useState<CourtCaseDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    statusFilter: CourtCaseStatusDto | "any";
    sortBy: "recent" | "reports";
  }>({ statusFilter: "any", sortBy: "recent" });
  const { statusFilter, sortBy } = filters;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiCourts();
        if (!active) return;
        setCases(res.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setCases([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...(cases ?? [])]
      .filter((c) => {
        const matchesTerm =
          term.length === 0 ||
          [c.title, c.subject, c.triggeredBy].some((field) =>
            field.toLowerCase().includes(term),
          );
        const matchesStatus =
          statusFilter === "any" ? true : c.status === statusFilter;
        return matchesTerm && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "reports") return b.reports - a.reports;
        return (
          new Date(b.opened.split("/").reverse().join("-")).getTime() -
          new Date(a.opened.split("/").reverse().join("-")).getTime()
        );
      });
  }, [cases, search, statusFilter, sortBy]);

  const openCases = (cases ?? []).filter((c) => c.status !== "ended").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="courts" />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Open cases",
            value: cases ? openCases : "—",
          },
          { label: "Jury panels", value: "12 seats / case" },
          { label: "New reports", value: "27 this week" },
          { label: "Ended (30d)", value: "6" },
        ].map((metric) => (
          <MetricTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            className="px-4 py-4"
          />
        ))}
      </section>

      {cases === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading court cases…
        </Card>
      ) : null}
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          Courts unavailable: {loadError}
        </Card>
      ) : null}

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search court cases, subjects, or reports…"
        ariaLabel="Search courts"
        filtersConfig={[
          {
            key: "statusFilter",
            label: "Status",
            options: [
              { value: "any", label: "Any status" },
              { value: "jury", label: "Jury forming" },
              { value: "live", label: "Session live" },
              { value: "ended", label: "Ended" },
            ],
          },
          {
            key: "sortBy",
            label: "Sort by",
            options: [
              { value: "recent", label: "Opened (newest)" },
              { value: "reports", label: "Reports (desc)" },
            ],
          },
        ]}
        filtersState={filters}
        onFiltersChange={setFilters}
      />

      {cases !== null && cases.length === 0 && !loadError ? (
        <NoDataYetBar label="court cases" />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active courtrooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.length === 0 ? (
              <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
                No court cases match the current filters.
              </Card>
            ) : (
              filtered.map((courtCase) => (
                <Card key={courtCase.id} className="bg-panel-alt">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {courtCase.subject}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <CourtStatusBadge status={courtCase.status} />
                        <p className="text-xs text-muted">
                          Opened {courtCase.opened}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                    <div className="flex flex-wrap gap-3 text-sm text-foreground">
                      <span className="rounded-full bg-panel px-3 py-1">
                        Reports: {courtCase.reports}
                      </span>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/app/courts/${courtCase.id}`}>
                        Open courtroom
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Courts;

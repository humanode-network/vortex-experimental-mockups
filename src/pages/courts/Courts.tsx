import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { AppPage } from "@/components/AppPage";
import { MetricTile } from "@/components/MetricTile";

type CourtCase = {
  id: string;
  title: string;
  subject: string;
  triggeredBy: string;
  status: "jury" | "deliberating" | "closed";
  reports: number;
  juryCount: number;
  opened: string;
};

const cases: CourtCase[] = [
  {
    id: "delegation-44",
    title: "Delegation Dispute #44",
    subject: "Faction · Protocol Keepers",
    triggeredBy: "18 reports · Delegation shift",
    status: "jury",
    reports: 18,
    juryCount: 12,
    opened: "02/04/2025",
  },
  {
    id: "treasury-audit-12",
    title: "Treasury Audit #12",
    subject: "Chamber · Economics & Treasury",
    triggeredBy: "12 reports · Budget anomaly",
    status: "deliberating",
    reports: 12,
    juryCount: 12,
    opened: "29/03/2025",
  },
  {
    id: "proposal-appeal-883",
    title: "Proposal Appeal #883",
    subject: "Proposal · Adaptive fee shaping",
    triggeredBy: "9 reports · Procedural appeal",
    status: "closed",
    reports: 9,
    juryCount: 12,
    opened: "21/03/2025",
  },
];

const statusStyles: Record<CourtCase["status"], string> = {
  jury: "bg-[color:var(--accent)]/15 text-[var(--accent)]",
  deliberating: "bg-[color:var(--accent-warm)]/15 text-[var(--accent-warm)]",
  closed: "bg-panel-alt text-muted",
};

const Courts: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourtCase["status"] | "any">(
    "any",
  );
  const [sortBy, setSortBy] = useState<"recent" | "reports">("recent");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...cases]
      .filter((c) => {
        const matchesTerm = [c.title, c.subject, c.triggeredBy].some((field) =>
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
  }, [search, statusFilter, sortBy]);
  return (
    <AppPage pageId="courts">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Open cases",
            value: cases.filter((c) => c.status !== "closed").length,
          },
          { label: "Jury panels", value: "12 seats / case" },
          { label: "New reports", value: "27 this week" },
          { label: "Closed cases (30d)", value: "6" },
        ].map((metric) => (
          <MetricTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            className="px-4 py-4"
          />
        ))}
      </section>

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
              { value: "deliberating", label: "Deliberating" },
              { value: "closed", label: "Closed" },
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
        filtersState={{ statusFilter, sortBy }}
        onFiltersChange={(next) => {
          if (next.statusFilter)
            setStatusFilter(next.statusFilter as CourtCase["status"] | "any");
          if (next.sortBy) setSortBy(next.sortBy as "recent" | "reports");
        }}
      />

      <Card className="border border-border bg-panel">
        <CardHeader className="pb-2">
          <CardTitle>Active courtrooms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((courtCase) => (
            <Card
              key={courtCase.id}
              className="border border-border bg-panel-alt"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs tracking-wide text-muted uppercase">
                      {courtCase.subject}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {courtCase.title}
                    </p>
                    <p className="text-xs text-muted">
                      {courtCase.triggeredBy}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={statusStyles[courtCase.status]}
                      variant="outline"
                    >
                      {courtCase.status === "jury"
                        ? "Jury forming"
                        : courtCase.status === "deliberating"
                          ? "Deliberating"
                          : "Closed"}
                    </Badge>
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
                  <span className="rounded-full bg-panel px-3 py-1">
                    Jury: {courtCase.juryCount} governors
                  </span>
                </div>
                <Button asChild size="sm">
                  <Link to={`/courts/${courtCase.id}`}>Open courtroom</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </AppPage>
  );
};

export default Courts;

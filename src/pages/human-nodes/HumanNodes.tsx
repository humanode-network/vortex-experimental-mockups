import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/primitives/card";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import { Badge } from "@/components/primitives/badge";
import { HintLabel } from "@/components/Hint";
import { SearchBar } from "@/components/SearchBar";
import { PageHint } from "@/components/PageHint";
import { StatTile } from "@/components/StatTile";
import { Kicker } from "@/components/Kicker";
import { TierLabel } from "@/components/TierLabel";
import { ToggleGroup } from "@/components/ToggleGroup";
import { humanNodes as sampleNodes } from "@/data/mock/humanNodes";

const HumanNodes: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    sortBy: "acm-desc" | "acm-asc" | "tier" | "name";
    tierFilter:
      | "all"
      | "nominee"
      | "ecclesiast"
      | "legate"
      | "consul"
      | "citizen";
  }>({ sortBy: "acm-desc", tierFilter: "all" });
  const { sortBy, tierFilter } = filters;
  const [view, setView] = useState<"cards" | "list">("cards");

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return [...sampleNodes]
      .filter((node) => {
        const matchesTerm =
          node.name.toLowerCase().includes(term) ||
          node.role.toLowerCase().includes(term) ||
          node.tags.some((t) => t.toLowerCase().includes(term)) ||
          node.chamber.toLowerCase().includes(term);
        const matchesTier =
          tierFilter === "all" ? true : node.tier === tierFilter;
        return matchesTerm && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === "acm-desc") return b.acm - a.acm;
        if (sortBy === "acm-asc") return a.acm - b.acm;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        const order = ["nominee", "ecclesiast", "legate", "consul", "citizen"];
        return order.indexOf(a.tier) - order.indexOf(b.tier);
      });
  }, [search, sortBy, tierFilter]);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="human-nodes" />
      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search human nodes by handle, chamber, focus…"
        ariaLabel="Search human nodes"
        filtersConfig={[
          {
            key: "sortBy",
            label: "Sort by",
            options: [
              { value: "acm-desc", label: "ACM (desc)" },
              { value: "acm-asc", label: "ACM (asc)" },
              { value: "tier", label: "Tier" },
              { value: "name", label: "Name" },
            ],
          },
          {
            key: "tierFilter",
            label: "Tier filter",
            options: [
              { value: "all", label: "All tiers" },
              { value: "nominee", label: "Nominee" },
              { value: "ecclesiast", label: "Ecclesiast" },
              { value: "legate", label: "Legate" },
              { value: "consul", label: "Consul" },
              { value: "citizen", label: "Citizen" },
            ],
          },
        ]}
        filtersState={filters}
        onFiltersChange={setFilters}
      />

      <Card className="w-full">
        <CardHeader className="pb-2">
          <Kicker>Results ({filtered.length})</Kicker>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="font-semibold whitespace-nowrap">
                Sort by
              </Label>
              <Select
                id="sort"
                className="h-10 min-w-[180px]"
                value={sortBy}
                onChange={(e) =>
                  setFilters((curr) => ({
                    ...curr,
                    sortBy: e.target.value as typeof sortBy,
                  }))
                }
              >
                <option value="acm-desc">ACM (desc)</option>
                <option value="acm-asc">ACM (asc)</option>
                <option value="tier">Tier</option>
                <option value="name">Name</option>
              </Select>
            </div>
            <ToggleGroup
              className="ml-auto"
              value={view}
              onValueChange={(val) => setView(val as "cards" | "list")}
              options={[
                { value: "cards", label: "Cards" },
                { value: "list", label: "List" },
              ]}
            />
          </div>

          {view === "cards" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((node) => {
                const tileItems = [
                  { label: "ACM", value: node.acm.toString() },
                  { label: "MM", value: node.mm.toString() },
                  {
                    label: "Tier",
                    value: (
                      <TierLabel tier={node.tier}>
                        {node.tier.charAt(0).toUpperCase() + node.tier.slice(1)}
                      </TierLabel>
                    ),
                  },
                  {
                    label: "Governor",
                    value: node.active ? "Active" : "Not active",
                  },
                  {
                    label: "Human node",
                    value: node.active ? "Active" : "Inactive",
                  },
                  { label: "Main chamber", value: node.chamber },
                  {
                    label: "Formation member",
                    value: node.formationCapable ? "Yes" : "No",
                  },
                  {
                    label: "Formation project",
                    value: node.formationProject ?? "—",
                  },
                  {
                    label: "Human node since",
                    value: node.memberSince,
                  },
                ];
                return (
                  <Card key={node.id}>
                    <CardContent className="flex flex-col gap-4 pt-4">
                      <div>
                        <h3 className="text-lg font-semibold">{node.name}</h3>
                        <p className="text-sm text-muted">{node.role}</p>
                      </div>
                      <div className="grid auto-rows-fr grid-cols-2 gap-3">
                        {tileItems.map((item) => (
                          <StatTile
                            key={item.label}
                            label={
                              item.label === "ACM" ? (
                                <HintLabel termId="acm">ACM</HintLabel>
                              ) : item.label === "MM" ? (
                                <HintLabel termId="meritocratic_measure">
                                  MM
                                </HintLabel>
                              ) : (
                                item.label
                              )
                            }
                            value={item.value}
                            radius="xl"
                            variant="panelAlt"
                            className="px-4 py-3"
                            labelClassName="text-[0.65rem]"
                            valueClassName="text-base"
                          />
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2 pt-0">
                      <Button asChild size="sm">
                        <Link to={`/app/human-nodes/${node.id}`}>
                          Open profile
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((node) => (
                <Card key={node.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="min-w-[200px] flex-1">
                        <h4 className="text-base font-semibold">{node.name}</h4>
                        <p className="text-sm text-muted">{node.role}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge size="sm">
                          <HintLabel termId="acm" className="mr-1">
                            ACM
                          </HintLabel>{" "}
                          {node.acm}
                        </Badge>
                        <Badge size="sm">
                          <HintLabel
                            termId="meritocratic_measure"
                            className="mr-1"
                          >
                            MM
                          </HintLabel>{" "}
                          {node.mm}
                        </Badge>
                        {node.formationCapable && (
                          <Badge size="sm" variant="outline">
                            Formation
                          </Badge>
                        )}
                      </div>
                      <div className="ml-auto">
                        <Button asChild size="sm">
                          <Link to={`/app/human-nodes/${node.id}`}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HumanNodes;

import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import "./HumanNodes.css";
import { HintLabel } from "@/components/Hint";
import { PageHint } from "@/components/PageHint";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

// Data types and sample data
type Node = {
  id: string;
  name: string;
  role: string;
  chamber: string;
  tier: string;
  acm: number;
  mm: number;
  formationCapable?: boolean;
  active: boolean;
  formationProject?: string;
  tags: string[];
};

const sampleNodes: Node[] = [
  {
    id: "JohnDoe",
    name: "JohnDoe",
    role: "Legate · Protocol Engineering",
    chamber: "protocol",
    tier: "legate",
    acm: 182,
    mm: 92,
    formationCapable: true,
    active: true,
    formationProject: "Protocol council",
    tags: ["protocol", "security", "research"],
  },
  {
    id: "Raamara",
    name: "Raamara",
    role: "Consul · Economics",
    chamber: "economics",
    tier: "consul",
    acm: 168,
    mm: 80,
    formationCapable: true,
    active: true,
    formationProject: "Treasury ops",
    tags: ["treasury", "formation", "community"],
  },
  {
    id: "Nyx",
    name: "Nyx",
    role: "Ecclesiast · Security",
    chamber: "security",
    tier: "ecclesiast",
    acm: 155,
    mm: 78,
    formationCapable: false,
    active: false,
    formationProject: "Security audits",
    tags: ["security", "infra", "audits"],
  },
  {
    id: "Nana",
    name: "Nana",
    role: "Consul · Community & Treasury",
    chamber: "economics",
    tier: "consul",
    acm: 161,
    mm: 84,
    formationCapable: true,
    active: true,
    formationProject: "Community treasury",
    tags: ["treasury", "community", "formation"],
  },
  {
    id: "Victor",
    name: "Victor",
    role: "Legate · Research Ops",
    chamber: "research",
    tier: "legate",
    acm: 149,
    mm: 76,
    formationCapable: false,
    active: true,
    formationProject: "Research guild",
    tags: ["research", "protocol", "infra"],
  },
  {
    id: "Tony",
    name: "Tony",
    role: "Ecclesiast · Social",
    chamber: "social",
    tier: "ecclesiast",
    acm: 138,
    mm: 70,
    formationCapable: true,
    active: false,
    formationProject: "Community outreach",
    tags: ["social", "community", "formation"],
  },
  {
    id: "Dima",
    name: "Dima",
    role: "Nominee · Security Apprentice",
    chamber: "security",
    tier: "nominee",
    acm: 122,
    mm: 62,
    formationCapable: false,
    active: true,
    formationProject: "Audit rotation",
    tags: ["security", "audits"],
  },
  {
    id: "Shannon",
    name: "Shannon",
    role: "Consul · Formation Logistics",
    chamber: "formation",
    tier: "consul",
    acm: 171,
    mm: 88,
    formationCapable: true,
    active: true,
    formationProject: "Formation logistics",
    tags: ["formation", "operations", "logistics"],
  },
  {
    id: "Sasha",
    name: "Sasha",
    role: "Citizen · Constitutional Observer",
    chamber: "protocol",
    tier: "citizen",
    acm: 118,
    mm: 60,
    formationCapable: false,
    active: true,
    formationProject: "Audit trail",
    tags: ["research", "protocol"],
  },
  {
    id: "VictorM",
    name: "Victor M",
    role: "Legate · Mesh Ops",
    chamber: "protocol",
    tier: "legate",
    acm: 165,
    mm: 85,
    formationCapable: true,
    active: true,
    formationProject: "Mesh redundancy",
    tags: ["protocol", "infra", "formation"],
  },
  {
    id: "Cass",
    name: "Cass",
    role: "Ecclesiast · Treasury Ops",
    chamber: "economics",
    tier: "ecclesiast",
    acm: 147,
    mm: 74,
    formationCapable: true,
    active: true,
    formationProject: "Treasury dashboard",
    tags: ["treasury", "community"],
  },
  {
    id: "Lena",
    name: "Lena",
    role: "Consul · Social Impact",
    chamber: "social",
    tier: "consul",
    acm: 158,
    mm: 83,
    formationCapable: true,
    active: true,
    formationProject: "Impact guild",
    tags: ["social", "community"],
  },
  {
    id: "Artem",
    name: "Artem",
    role: "Legate · Security Infra",
    chamber: "security",
    tier: "legate",
    acm: 166,
    mm: 89,
    formationCapable: true,
    active: true,
    formationProject: "Deterrence drills",
    tags: ["security", "infra"],
  },
  {
    id: "Juno",
    name: "Juno",
    role: "Nominee · Research Fellow",
    chamber: "research",
    tier: "nominee",
    acm: 119,
    mm: 64,
    formationCapable: false,
    active: true,
    formationProject: "Research fellowship",
    tags: ["research", "protocol"],
  },
  {
    id: "Iris",
    name: "Iris",
    role: "Ecclesiast · Community Ops",
    chamber: "social",
    tier: "ecclesiast",
    acm: 140,
    mm: 72,
    formationCapable: true,
    active: false,
    formationProject: "Care outreach",
    tags: ["social", "community", "formation"],
  },
  {
    id: "Taro",
    name: "Taro",
    role: "Consul · Formation Logistics",
    chamber: "formation",
    tier: "consul",
    acm: 172,
    mm: 87,
    formationCapable: true,
    active: true,
    formationProject: "Formation supply",
    tags: ["formation", "operations"],
  },
];

const HumanNodes: React.FC = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "acm-desc" | "acm-asc" | "tier" | "name"
  >("acm-desc");
  const [view, setView] = useState<"cards" | "list">("cards");
  const [tierFilter, setTierFilter] = useState("any");
  const [chamberFilter, setChamberFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("any");
  const [formationOnly, setFormationOnly] = useState(false);
  const [acmMin, setAcmMin] = useState(0);
  const [mmMin, setMmMin] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelId = `${useId()}-filters`;

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return [...sampleNodes]
      .filter((node) => {
        const matchesTerm =
          node.name.toLowerCase().includes(term) ||
          node.role.toLowerCase().includes(term) ||
          node.tags.some((t) => t.toLowerCase().includes(term));
        const matchesTier = tierFilter === "any" || node.tier === tierFilter;
        const matchesChamber =
          chamberFilter === "all" || node.chamber === chamberFilter;
        const matchesTag =
          tagFilter === "any" ||
          node.tags.some((t) => t.toLowerCase() === tagFilter);
        const matchesFormation = !formationOnly || node.formationCapable;
        const matchesScores = node.acm >= acmMin && node.mm >= mmMin;
        return (
          matchesTerm &&
          matchesTier &&
          matchesChamber &&
          matchesTag &&
          matchesFormation &&
          matchesScores
        );
      })
      .sort((a, b) => {
        if (sortBy === "acm-desc") return b.acm - a.acm;
        if (sortBy === "acm-asc") return a.acm - b.acm;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        const order = ["nominee", "ecclesiast", "legate", "consul", "citizen"];
        return order.indexOf(a.tier) - order.indexOf(b.tier);
      });
  }, [
    search,
    sortBy,
    tierFilter,
    chamberFilter,
    tagFilter,
    formationOnly,
    acmMin,
    mmMin,
  ]);

  return (
    <div className="app-page human-nodes-page">
      <div className="flex justify-end pb-2">
        <PageHint pageId="human-nodes" />
      </div>
      <Card className="bg-panel overflow-hidden border border-border">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls={filtersPanelId}
          onClick={() => setFiltersOpen((open) => !open)}
          className="hover:bg-panel-alt flex w-full items-center justify-between px-5 py-4 text-left transition"
        >
          <div>
            <p className="text-base font-semibold text-(--text)">
              Filters & search
            </p>
            <p className="text-xs text-muted">
              {filtersOpen ? "Expanded" : "Collapsed"}
            </p>
          </div>
          <ChevronDown
            className={clsx(
              "h-5 w-5 text-muted transition-transform",
              filtersOpen && "rotate-180",
            )}
          />
        </button>
        {filtersOpen && (
          <div
            id={filtersPanelId}
            className="space-y-6 border-t border-border p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-3">
                <Label
                  htmlFor="human-node-search"
                  className="text-sm font-medium text-(--text)"
                >
                  Keyword search
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="human-node-search"
                    placeholder="Search Human nodes by handle, address, chamber, or focus…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button variant="outline">Search</Button>
                </div>
              </div>
              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select
                  id="tier"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="nominee">
                    <HintLabel termId="tier1_nominee">Nominee</HintLabel>
                  </option>
                  <option value="ecclesiast">
                    <HintLabel termId="tier2_ecclesiast">Ecclesiast</HintLabel>
                  </option>
                  <option value="legate">
                    <HintLabel termId="tier3_legate">Legate</HintLabel>
                  </option>
                  <option value="consul">
                    <HintLabel termId="tier4_consul">Consul</HintLabel>
                  </option>
                  <option value="citizen">
                    <HintLabel termId="tier5_citizen">Citizen</HintLabel>
                  </option>
                </Select>
              </div>
              <div>
                <Label htmlFor="chamber">Chamber</Label>
                <Select
                  id="chamber"
                  value={chamberFilter}
                  onChange={(e) => setChamberFilter(e.target.value)}
                >
                  <option value="all">All specializations</option>
                  <option value="protocol">Protocol Engineering</option>
                  <option value="research">Research</option>
                  <option value="finance">Finance</option>
                  <option value="social">Social</option>
                  <option value="formation">Formation Logistics</option>
                  <option value="economics">Economics</option>
                  <option value="security">Security & Infra</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="tag">Specialty tag</Label>
                <Select
                  id="tag"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="protocol">Protocol</option>
                  <option value="security">Security</option>
                  <option value="research">Research</option>
                  <option value="economics">Treasury / Economics</option>
                  <option value="formation">Formation</option>
                  <option value="social">Social / Community</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="acm">
                  <HintLabel termId="acm" className="mr-1">
                    ACM
                  </HintLabel>
                  ≥
                </Label>
                <Input
                  id="acm"
                  type="number"
                  value={acmMin}
                  onChange={(e) => setAcmMin(Number(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="mm">
                  <HintLabel termId="meritocratic_measure" className="mr-1">
                    MM
                  </HintLabel>
                  ≥
                </Label>
                <Input
                  id="mm"
                  type="number"
                  value={mmMin}
                  onChange={(e) => setMmMin(Number(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formationOnly}
                  onChange={(e) => setFormationOnly(e.target.checked)}
                  aria-label="Formation members only"
                />
                <span className="text-sm">Formation members only</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTierFilter("any");
                  setChamberFilter("all");
                  setSearch("");
                  setSortBy("acm-desc");
                  setTagFilter("any");
                  setFormationOnly(false);
                  setAcmMin(0);
                  setMmMin(0);
                }}
              >
                Reset
              </Button>
              <Button size="sm">Apply</Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="w-full">
        <CardHeader className="pb-2">
          <p className="text-xs tracking-wide text-muted uppercase">
            Results ({filtered.length})
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="human-nodes-toolbar">
            <div className="human-nodes-sort">
              <Label htmlFor="sort" className="human-nodes-sort-label">
                Sort by
              </Label>
              <Select
                id="sort"
                className="human-nodes-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="acm-desc">ACM (desc)</option>
                <option value="acm-asc">ACM (asc)</option>
                <option value="tier">Tier</option>
                <option value="name">Name</option>
              </Select>
            </div>
            <Tabs
              className="human-nodes-view-tabs"
              value={view}
              onValueChange={(val) => setView(val as "cards" | "list")}
              options={[
                { value: "cards", label: "Cards" },
                { value: "list", label: "List" },
              ]}
            />
          </div>

          {view === "cards" ? (
            <div className="human-nodes-card-grid">
              {filtered.map((node) => {
                const sinceDates: Record<string, string> = {
                  JohnDoe: "11.06.2021",
                  Raamara: "01.11.2024",
                  Nyx: "13.01.2022",
                  Nana: "07.09.2023",
                  Victor: "02.03.2024",
                  Tony: "23.12.2024",
                  Dima: "21.05.2022",
                  Shannon: "21.06.2024",
                };
                const tileItems = [
                  { label: "ACM", value: node.acm.toString() },
                  { label: "MM", value: node.mm.toString() },
                  {
                    label: "Tier",
                    value: (
                      <HintLabel
                        termId={
                          node.tier === "nominee"
                            ? "tier1_nominee"
                            : node.tier === "ecclesiast"
                              ? "tier2_ecclesiast"
                              : node.tier === "legate"
                                ? "tier3_legate"
                                : node.tier === "consul"
                                  ? "tier4_consul"
                                  : "tier5_citizen"
                        }
                      >
                        {node.tier.charAt(0).toUpperCase() + node.tier.slice(1)}
                      </HintLabel>
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
                    value:
                      sinceDates[node.id as keyof typeof sinceDates] ??
                      "01.01.2021",
                  },
                ];
                return (
                  <Card key={node.id} className="human-node-card border-border">
                    <CardContent className="human-node-card__content pt-4">
                      <div>
                        <h3 className="text-lg font-semibold">{node.name}</h3>
                        <p className="text-sm text-muted">{node.role}</p>
                      </div>
                      <div className="human-node-card__tiles">
                        {tileItems.map((item) => (
                          <div
                            key={item.label}
                            className="human-node-card__tile"
                          >
                            <span className="human-node-card__tile-label">
                              {item.label === "ACM" ? (
                                <HintLabel termId="acm">{item.label}</HintLabel>
                              ) : item.label === "MM" ? (
                                <HintLabel termId="meritocratic_measure">
                                  {item.label}
                                </HintLabel>
                              ) : (
                                item.label
                              )}
                            </span>
                            <span className="human-node-card__tile-value">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="human-node-card__footer justify-end gap-2 pt-0">
                      <Button asChild size="sm">
                        <Link to={`/human-nodes/${node.id}`}>Open profile</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="human-nodes-list">
              {filtered.map((node) => (
                <Card key={node.id} className="border-border">
                  <CardContent className="pt-4 pb-3">
                    <div className="human-node-row">
                      <div className="human-node-row__details">
                        <h4 className="text-base font-semibold">{node.name}</h4>
                        <p className="text-sm text-muted">{node.role}</p>
                      </div>
                      <div className="human-node-row__stats">
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
                      <div className="human-node-row__action">
                        <Button asChild size="sm">
                          <Link to={`/human-nodes/${node.id}`}>Open</Link>
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

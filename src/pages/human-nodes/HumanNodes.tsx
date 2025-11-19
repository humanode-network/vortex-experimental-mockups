import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import "./HumanNodes.css";

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
  { id: "Mozgiii", name: "Mozgiii", role: "Legate · Protocol Engineering", chamber: "protocol", tier: "legate", acm: 182, mm: 92, formationCapable: true, active: true, formationProject: "Protocol council", tags: ["protocol", "security", "research"] },
  { id: "Raamara", name: "Raamara", role: "Consul · Economics", chamber: "economics", tier: "consul", acm: 168, mm: 80, formationCapable: true, active: true, formationProject: "Treasury ops", tags: ["treasury", "formation", "community"] },
  { id: "Nyx", name: "Nyx", role: "Ecclesiast · Security", chamber: "security", tier: "ecclesiast", acm: 155, mm: 78, formationCapable: false, active: false, formationProject: "Security audits", tags: ["security", "infra", "audits"] },
  { id: "Nana", name: "Nana", role: "Consul · Community & Treasury", chamber: "economics", tier: "consul", acm: 161, mm: 84, formationCapable: true, active: true, formationProject: "Community treasury", tags: ["treasury", "community", "formation"] },
  { id: "Victor", name: "Victor", role: "Legate · Research Ops", chamber: "research", tier: "legate", acm: 149, mm: 76, formationCapable: false, active: true, formationProject: "Research guild", tags: ["research", "protocol", "infra"] },
  { id: "Tony", name: "Tony", role: "Ecclesiast · Social", chamber: "social", tier: "ecclesiast", acm: 138, mm: 70, formationCapable: true, active: false, formationProject: "Community outreach", tags: ["social", "community", "formation"] },
  { id: "Dima", name: "Dima", role: "Nominee · Security Apprentice", chamber: "security", tier: "nominee", acm: 122, mm: 62, formationCapable: false, active: true, formationProject: "Audit rotation", tags: ["security", "audits"] },
  { id: "Shannon", name: "Shannon", role: "Consul · Formation Logistics", chamber: "formation", tier: "consul", acm: 171, mm: 88, formationCapable: true, active: true, formationProject: "Formation logistics", tags: ["formation", "operations", "logistics"] },
];

const HumanNodes: React.FC = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"acm-desc" | "acm-asc" | "tier" | "name">("acm-desc");
  const [view, setView] = useState<"cards" | "list">("cards");
  const [tierFilter, setTierFilter] = useState("any");
  const [chamberFilter, setChamberFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("any");
  const [formationOnly, setFormationOnly] = useState(false);
  const [acmMin, setAcmMin] = useState(0);
  const [mmMin, setMmMin] = useState(0);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return [...sampleNodes]
      .filter((node) => {
        const matchesTerm =
          node.name.toLowerCase().includes(term) ||
          node.role.toLowerCase().includes(term) ||
          node.tags.some((t) => t.toLowerCase().includes(term));
        const matchesTier = tierFilter === "any" || node.tier === tierFilter;
        const matchesChamber = chamberFilter === "all" || node.chamber === chamberFilter;
        const matchesTag = tagFilter === "any" || node.tags.some((t) => t.toLowerCase() === tagFilter);
        const matchesFormation = !formationOnly || node.formationCapable;
        const matchesScores = node.acm >= acmMin && node.mm >= mmMin;
        return matchesTerm && matchesTier && matchesChamber && matchesTag && matchesFormation && matchesScores;
      })
      .sort((a, b) => {
        if (sortBy === "acm-desc") return b.acm - a.acm;
        if (sortBy === "acm-asc") return a.acm - b.acm;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        const order = ["nominee", "ecclesiast", "legate", "consul", "citizen"];
        return order.indexOf(a.tier) - order.indexOf(b.tier);
      });
  }, [search, sortBy, tierFilter, chamberFilter, tagFilter, formationOnly, acmMin, mmMin]);

  return (
    <div className="app-page human-nodes-page">
      <div className="w-full rounded-2xl border border-border bg-panel p-3 shadow-sm">
        <div className="human-nodes-toolbar">
          <Input
            placeholder="Search Human nodes by handle, address, chamber, or focus…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="human-nodes-search-input"
          />
          <Button variant="outline" size="md" className="human-nodes-search-button">
            Search
          </Button>
        </div>
      </div>

      <div className="human-nodes-layout">
        <div className="human-nodes-main">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-wide text-muted">Results ({filtered.length})</p>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
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
                      Mozgiii: "11.06.2021",
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
                      { label: "Tier", value: node.tier.charAt(0).toUpperCase() + node.tier.slice(1) },
                      { label: "Governor", value: node.active ? "Active" : "Not active" },
                      { label: "Human node", value: node.active ? "Active" : "Inactive" },
                      { label: "Main chamber", value: node.chamber },
                      { label: "Formation member", value: node.formationCapable ? "Yes" : "No" },
                      { label: "Formation project", value: node.formationProject ?? "—" },
                      {
                        label: "Human node since",
                        value: sinceDates[node.id as keyof typeof sinceDates] ?? "01.01.2021",
                      },
                    ];
                    return (
                      <Card key={node.id} className="border-border human-node-card">
                        <CardContent className="human-node-card__content pt-4">
                          <div>
                            <h3 className="text-lg font-semibold">{node.name}</h3>
                            <p className="text-sm text-muted">{node.role}</p>
                          </div>
                          <div className="human-node-card__tiles">
                            {tileItems.map((item) => (
                              <div key={item.label} className="human-node-card__tile">
                                <span className="human-node-card__tile-label">{item.label}</span>
                                <span className="human-node-card__tile-value">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 justify-end gap-2 human-node-card__footer">
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
                            <Badge size="sm">ACM: {node.acm}</Badge>
                            <Badge size="sm">MM: {node.mm}</Badge>
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

        <aside className="human-nodes-sidebar">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-wide text-muted">Filters</p>
              <CardTitle>Refine directory</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="human-nodes-filter-groups">
                <div>
                  <Label htmlFor="tier">Tier</Label>
                  <Select id="tier" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                    <option value="any">Any</option>
                    <option value="nominee">Nominee</option>
                    <option value="ecclesiast">Ecclesiast</option>
                    <option value="legate">Legate</option>
                    <option value="consul">Consul</option>
                    <option value="citizen">Citizen</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chamber">Chamber</Label>
                  <Select id="chamber" value={chamberFilter} onChange={(e) => setChamberFilter(e.target.value)}>
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
                  <Select id="tag" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                    <option value="any">Any</option>
                    <option value="protocol">Protocol</option>
                    <option value="security">Security</option>
                    <option value="research">Research</option>
                    <option value="economics">Treasury / Economics</option>
                    <option value="formation">Formation</option>
                    <option value="social">Social / Community</option>
                  </Select>
                </div>
                <div className="human-nodes-filter-row">
                  <div>
                    <Label htmlFor="acm">ACM ≥</Label>
                    <Input
                      id="acm"
                      type="number"
                      value={acmMin}
                      onChange={(e) => setAcmMin(Number(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mm">MM ≥</Label>
                    <Input
                      id="mm"
                      type="number"
                      value={mmMin}
                      onChange={(e) => setMmMin(Number(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Switch
                    checked={formationOnly}
                    onChange={(e) => setFormationOnly(e.target.checked)}
                    aria-label="Formation members only"
                  />
                  <span className="text-sm">Formation members only</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
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
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default HumanNodes;

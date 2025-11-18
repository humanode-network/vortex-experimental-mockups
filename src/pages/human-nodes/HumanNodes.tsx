import { useMemo, useState } from "react";
import { Link } from "react-router";
import Grid from "@mui/material/PigmentGrid";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Switch from "@mui/material/Switch";

type Node = {
  id: string;
  name: string;
  role: string;
  chamber: string;
  tier: string;
  acm: number;
  mm: number;
  formationCapable?: boolean;
  tags: string[];
};

const sampleNodes: Node[] = [
  { id: "Mozgiii", name: "Mozgiii", role: "Legate · Protocol Engineering", chamber: "protocol", tier: "legate", acm: 182, mm: 92, formationCapable: true, tags: ["protocol", "security", "research"] },
  { id: "Raamara", name: "Raamara", role: "Consul · Economics", chamber: "economics", tier: "consul", acm: 168, mm: 80, formationCapable: true, tags: ["treasury", "formation", "community"] },
  { id: "Nyx", name: "Nyx", role: "Ecclesiast · Security", chamber: "security", tier: "ecclesiast", acm: 155, mm: 78, formationCapable: false, tags: ["security", "infra", "audits"] },
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
    <Box className="app-page" display="flex" flexDirection="column" gap={2}>
      <TextField
        fullWidth
        placeholder="Search Human nodes by handle, address, chamber, or focus…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button variant="outlined" size="small">
                Search
              </Button>
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%" }}>
            <CardContent>
              <Typography className="eyebrow" component="p" mb={1.5}>
                Results ({filtered.length})
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                mb={2}
              >
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                    <MenuItem value="acm-desc">ACM (desc)</MenuItem>
                    <MenuItem value="acm-asc">ACM (asc)</MenuItem>
                    <MenuItem value="tier">Tier</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                  </Select>
                </FormControl>
                <Box display="flex" justifyContent="flex-end" width={{ xs: "100%", sm: "auto" }}>
                  <ToggleButtonGroup
                    value={view}
                    exclusive
                    size="small"
                    onChange={(_, val) => val && setView(val)}
                  >
                    <ToggleButton value="cards">Cards</ToggleButton>
                    <ToggleButton value="list">List</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Stack>

              <Stack spacing={2}>
                {filtered.map((node) => (
                  <Card key={node.id} variant="outlined">
                    <CardContent sx={{ pb: 0 }}>
                      <Grid container spacing={1} sx={{ alignItems: view === "list" ? "center" : "flex-start" }}>
                        <Grid size={{ xs: 12, md: view === "list" ? 6 : 12 }}>
                          <Typography variant="h6">{node.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {node.role}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: view === "list" ? 6 : 12 }}>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip label={`ACM: ${node.acm}`} variant="outlined" />
                            <Chip label={`MM: ${node.mm}`} variant="outlined" />
                          </Stack>
                        </Grid>
                      </Grid>
                      <Stack direction="row" spacing={1} flexWrap="wrap" mt={view === "list" ? 0.5 : 1.5}>
                        {node.tags.map((tag) => (
                          <Chip key={tag} label={tag} variant="outlined" />
                        ))}
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button component={Link} to={`/human-nodes/${node.id}`} size="small" variant="contained">
                        Open profile
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <Card sx={{ width: "100%" }}>
            <CardContent>
              <Typography className="eyebrow" component="p">
                Filters
              </Typography>
              <Typography variant="h6">Refine directory</Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tier</InputLabel>
                    <Select value={tierFilter} label="Tier" onChange={(e) => setTierFilter(e.target.value)}>
                      <MenuItem value="any">Any</MenuItem>
                      <MenuItem value="nominee">Nominee</MenuItem>
                      <MenuItem value="ecclesiast">Ecclesiast</MenuItem>
                      <MenuItem value="legate">Legate</MenuItem>
                      <MenuItem value="consul">Consul</MenuItem>
                      <MenuItem value="citizen">Citizen</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Chamber</InputLabel>
                    <Select value={chamberFilter} label="Chamber" onChange={(e) => setChamberFilter(e.target.value)}>
                      <MenuItem value="all">All specializations</MenuItem>
                      <MenuItem value="protocol">Protocol Engineering</MenuItem>
                      <MenuItem value="research">Research</MenuItem>
                      <MenuItem value="finance">Finance</MenuItem>
                      <MenuItem value="social">Social</MenuItem>
                      <MenuItem value="formation">Formation Logistics</MenuItem>
                      <MenuItem value="economics">Economics</MenuItem>
                      <MenuItem value="security">Security & Infra</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Specialty tag</InputLabel>
                    <Select value={tagFilter} label="Specialty tag" onChange={(e) => setTagFilter(e.target.value)}>
                      <MenuItem value="any">Any</MenuItem>
                      <MenuItem value="protocol">Protocol</MenuItem>
                      <MenuItem value="security">Security</MenuItem>
                      <MenuItem value="research">Research</MenuItem>
                      <MenuItem value="economics">Treasury / Economics</MenuItem>
                      <MenuItem value="formation">Formation</MenuItem>
                      <MenuItem value="social">Social / Community</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="ACM ≥"
                      type="number"
                      value={acmMin}
                      onChange={(e) => setAcmMin(Number(e.target.value) || 0)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      label="MM ≥"
                      type="number"
                      value={mmMin}
                      onChange={(e) => setMmMin(Number(e.target.value) || 0)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Stack>
                </Grid>
                <Grid size={12}>
                  <FormControlLabel
                    control={<Switch checked={formationOnly} onChange={(e) => setFormationOnly(e.target.checked)} />}
                    label="Formation-capable only"
                  />
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setTierFilter("any");
                    setChamberFilter("all");
                    setSearch("");
                    setSortBy("acm-desc");
                  }}
                >
                  Reset
                </Button>
                <Button variant="contained" size="small">
                  Apply
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HumanNodes;

export type FormationMetric = {
  label: string;
  value: string;
  dataAttr: string;
};

export type FormationCategory = "all" | "research" | "development" | "social";
export type FormationStage = "live" | "gathering" | "completed";

export type FormationProject = {
  id: string;
  title: string;
  focus: string;
  proposer: string;
  summary: string;
  category: FormationCategory;
  stage: FormationStage;
  budget: string;
  milestones: string;
  teamSlots: string;
};

export const formationMetrics: FormationMetric[] = [
  { label: "Total funded HMND", value: "425k", dataAttr: "metric-hmnd" },
  { label: "Active projects", value: "2", dataAttr: "metric-active" },
  { label: "Open team slots", value: "4", dataAttr: "metric-slots" },
  { label: "Milestones delivered", value: "3", dataAttr: "metric-milestones" },
];

export const formationProjects: FormationProject[] = [
  {
    id: "evm-dev-starter-kit",
    title: "Humanode EVM Dev Starter Kit & Testing Sandbox",
    focus: "Engineering chamber · Developer tooling",
    proposer: "Sesh",
    summary:
      "Starter kit + public sandbox so developers can deploy EVM dApps on Humanode in under 30 minutes.",
    category: "development",
    stage: "live",
    budget: "180k HMND",
    milestones: "1 / 3",
    teamSlots: "2 open",
  },
  {
    id: "mev-safe-dex-v1-launch-sprint",
    title: "Humanode MEV-Safe DEX v1 + Launch Sprint",
    focus: "Engineering chamber · Protected swaps",
    proposer: "Dato",
    summary:
      "MEV-protected DEX + Biostaker/getHMND integrations and fees to Human Nodes, with an audited mainnet launch.",
    category: "development",
    stage: "gathering",
    budget: "245k HMND",
    milestones: "2 / 4",
    teamSlots: "2 open",
  },
];

export const formationStageLabel = (stage: FormationStage): string => {
  if (stage === "live") return "Live";
  if (stage === "gathering") return "Gathering";
  return "Completed";
};

export const getFormationProjectById = (
  id: string | undefined,
): FormationProject | undefined =>
  (id ? formationProjects.find((project) => project.id === id) : undefined) ??
  undefined;

export default formationProjects;

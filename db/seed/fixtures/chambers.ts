export type ChamberPipeline = {
  pool: number;
  vote: number;
  build: number;
};

export type ChamberStats = {
  governors: string;
  acm: string;
  mcm: string;
  lcm: string;
};

export type Chamber = {
  id: string;
  name: string;
  multiplier: number;
  stats: ChamberStats;
  pipeline: ChamberPipeline;
};

export const chambers: Chamber[] = [
  {
    id: "engineering",
    name: "Engineering",
    multiplier: 1.5,
    stats: { governors: "22", acm: "3,400", mcm: "1,600", lcm: "1,800" },
    pipeline: { pool: 2, vote: 2, build: 1 },
  },
  {
    id: "economics",
    name: "Economics",
    multiplier: 1.3,
    stats: { governors: "18", acm: "2,950", mcm: "1,400", lcm: "1,550" },
    pipeline: { pool: 2, vote: 2, build: 1 },
  },
  {
    id: "product",
    name: "Product",
    multiplier: 1.2,
    stats: { governors: "12", acm: "1,900", mcm: "900", lcm: "1,000" },
    pipeline: { pool: 1, vote: 0, build: 3 },
  },
  {
    id: "marketing",
    name: "Marketing",
    multiplier: 1.1,
    stats: { governors: "10", acm: "1,480", mcm: "700", lcm: "780" },
    pipeline: { pool: 1, vote: 1, build: 0 },
  },
  {
    id: "general",
    name: "General",
    multiplier: 1.2,
    stats: { governors: "15", acm: "2,600", mcm: "1,200", lcm: "1,400" },
    pipeline: { pool: 2, vote: 1, build: 0 },
  },
  {
    id: "design",
    name: "Design",
    multiplier: 1.4,
    stats: { governors: "23", acm: "3,800", mcm: "1,800", lcm: "2,000" },
    pipeline: { pool: 1, vote: 2, build: 1 },
  },
];

export const getChamberById = (id: string | undefined): Chamber | undefined =>
  (id ? chambers.find((chamber) => chamber.id === id) : undefined) ?? undefined;

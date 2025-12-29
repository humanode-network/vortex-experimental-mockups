import type { ReactNode } from "react";

import { HintLabel } from "@/components/Hint";

export type GovernorTier =
  | "Nominee"
  | "Ecclesiast"
  | "Legate"
  | "Consul"
  | "Citizen";

export const tierToTermId = (tier: string): string => {
  const normalized = tier.trim().toLowerCase();
  if (normalized === "nominee") return "tier1_nominee";
  if (normalized === "ecclesiast") return "tier2_ecclesiast";
  if (normalized === "legate") return "tier3_legate";
  if (normalized === "consul") return "tier4_consul";
  return "tier5_citizen";
};

type TierLabelProps = {
  tier: string;
  children?: ReactNode;
};

export const TierLabel: React.FC<TierLabelProps> = ({ tier, children }) => {
  return <HintLabel termId={tierToTermId(tier)}>{children ?? tier}</HintLabel>;
};

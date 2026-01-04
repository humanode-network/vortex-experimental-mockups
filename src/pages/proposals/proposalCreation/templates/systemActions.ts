export type SystemActionId = "chamber.create" | "chamber.dissolve";

export const SYSTEM_ACTIONS: Record<
  SystemActionId,
  {
    label: string;
    description: string;
    requiresTitle: boolean;
    showMultiplier: boolean;
    showGenesisMembers: boolean;
  }
> = {
  "chamber.create": {
    label: "Create chamber",
    description: "Establish a new specialization chamber with genesis members.",
    requiresTitle: true,
    showMultiplier: true,
    showGenesisMembers: true,
  },
  "chamber.dissolve": {
    label: "Dissolve chamber",
    description: "Remove an existing chamber via General-chamber approval.",
    requiresTitle: false,
    showMultiplier: false,
    showGenesisMembers: false,
  },
};

export function getSystemActionMeta(action: SystemActionId | undefined) {
  if (action && action in SYSTEM_ACTIONS) return SYSTEM_ACTIONS[action];
  return SYSTEM_ACTIONS["chamber.create"];
}

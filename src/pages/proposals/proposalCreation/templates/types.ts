import type { ProposalDraftForm, StepKey } from "../types.ts";

export type WizardTemplateId = "project" | "system";

export type WizardComputed = {
  essentialsValid: boolean;
  planValid: boolean;
  budgetValid: boolean;
  canSubmit: boolean;
};

export type WizardTemplate = {
  id: WizardTemplateId;
  label: string;
  description: string;
  stepOrder: readonly StepKey[];
  stepTitles: Record<StepKey, string>;
  stepTabLabels: Record<StepKey, string>;
  compute: (
    draft: ProposalDraftForm,
    input: { budgetTotal: number },
  ) => WizardComputed;
  getNextStep: (step: StepKey, computed: WizardComputed) => StepKey | null;
  getPrevStep: (step: StepKey) => StepKey | null;
};

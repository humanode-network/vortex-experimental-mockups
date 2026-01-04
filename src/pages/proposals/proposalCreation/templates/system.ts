import type { ProposalDraftForm } from "../types.ts";
import type { WizardComputed, WizardTemplate } from "./types.ts";

function computeSystemWizard(
  draft: ProposalDraftForm,
  _input: { budgetTotal: number },
): WizardComputed {
  const essentialsValid = draft.title.trim().length > 0;

  const planValid = draft.how.trim().length > 0;

  const meta = draft.metaGovernance;
  const systemValid = Boolean(
    meta &&
      draft.chamberId.toLowerCase() === "general" &&
      meta.chamberId.trim().length > 0 &&
      (meta.action === "chamber.dissolve"
        ? true
        : (meta.title ?? "").trim().length > 0),
  );

  const canSubmit =
    essentialsValid &&
    planValid &&
    systemValid &&
    draft.agreeRules &&
    draft.confirmBudget;

  return {
    essentialsValid: essentialsValid && systemValid,
    planValid,
    budgetValid: true,
    canSubmit,
  };
}

export const systemTemplate: WizardTemplate = {
  id: "system",
  label: "System change",
  description:
    "A General-chamber proposal that updates simulation variables directly (e.g., chamber creation or dissolution).",
  stepOrder: ["essentials", "plan", "review"],
  stepTitles: {
    essentials: "Setup",
    plan: "Rationale",
    budget: "Budget",
    review: "Review",
  },
  stepTabLabels: {
    essentials: "1 · Setup",
    plan: "2 · Rationale",
    budget: "3 · Budget",
    review: "3 · Review",
  },
  compute: computeSystemWizard,
  getNextStep(step, computed) {
    if (step === "essentials") return computed.essentialsValid ? "plan" : null;
    if (step === "plan") return computed.planValid ? "review" : null;
    return null;
  },
  getPrevStep(step) {
    if (step === "review") return "plan";
    if (step === "plan") return "essentials";
    return null;
  },
};

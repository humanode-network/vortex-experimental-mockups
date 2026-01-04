import type { ProposalDraftForm } from "../types.ts";
import type { WizardComputed, WizardTemplate } from "./types.ts";

function computeProjectWizard(
  draft: ProposalDraftForm,
  input: { budgetTotal: number },
): WizardComputed {
  const essentialsValid =
    draft.title.trim().length > 0 &&
    draft.what.trim().length > 0 &&
    draft.why.trim().length > 0;
  const planValid = draft.how.trim().length > 0;
  const budgetValid =
    draft.budgetItems.some(
      (item) =>
        item.description.trim().length > 0 &&
        Number.isFinite(Number(item.amount)) &&
        Number(item.amount) > 0,
    ) && input.budgetTotal > 0;

  const canSubmit =
    essentialsValid &&
    planValid &&
    budgetValid &&
    draft.agreeRules &&
    draft.confirmBudget;

  return { essentialsValid, planValid, budgetValid, canSubmit };
}

export const projectTemplate: WizardTemplate = {
  id: "project",
  label: "Project",
  description: "The default proposal wizard flow for project proposals.",
  stepOrder: ["essentials", "plan", "budget", "review"],
  stepTitles: {
    essentials: "Essentials",
    plan: "Plan",
    budget: "Budget",
    review: "Review",
  },
  stepTabLabels: {
    essentials: "1 · Essentials",
    plan: "2 · Plan",
    budget: "3 · Budget",
    review: "4 · Review",
  },
  compute: computeProjectWizard,
  getNextStep(step, computed) {
    if (step === "essentials") return computed.essentialsValid ? "plan" : null;
    if (step === "plan") return computed.planValid ? "budget" : null;
    if (step === "budget") return computed.budgetValid ? "review" : null;
    return null;
  },
  getPrevStep(step) {
    if (step === "review") return "budget";
    if (step === "budget") return "plan";
    if (step === "plan") return "essentials";
    return null;
  },
};

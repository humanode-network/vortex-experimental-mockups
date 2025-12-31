import type { ProposalDraftFormPayload } from "@/lib/apiClient";
import type { ProposalDraftForm } from "./types";

export function draftToApiForm(
  draft: ProposalDraftForm,
): ProposalDraftFormPayload {
  return {
    title: draft.title,
    chamberId: draft.chamberId,
    summary: draft.summary,
    what: draft.what,
    why: draft.why,
    how: draft.how,
    timeline: draft.timeline,
    outputs: draft.outputs,
    budgetItems: draft.budgetItems,
    aboutMe: draft.aboutMe,
    attachments: draft.attachments,
    agreeRules: draft.agreeRules,
    confirmBudget: draft.confirmBudget,
  };
}

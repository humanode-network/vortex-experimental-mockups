import type { ProposalDraftForm, StepKey } from "./types";
import { DEFAULT_DRAFT } from "./types";

export const STORAGE_KEY = "vortex:proposalCreation:draft";
export const STORAGE_STEP_KEY = "vortex:proposalCreation:step";
export const STORAGE_TEMPLATE_KEY = "vortex:proposalCreation:template";
const STORAGE_SERVER_DRAFT_ID_KEY = "vortex:proposalCreation:serverDraftId";

export function loadDraft(): ProposalDraftForm {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    const parsed = JSON.parse(raw) as Partial<ProposalDraftForm>;
    const chamberId =
      typeof parsed.chamberId === "string" ? parsed.chamberId : "";
    return {
      ...DEFAULT_DRAFT,
      ...parsed,
      chamberId,
      timeline: Array.isArray(parsed.timeline)
        ? parsed.timeline.filter(Boolean)
        : DEFAULT_DRAFT.timeline,
      outputs: Array.isArray(parsed.outputs)
        ? parsed.outputs.filter(Boolean)
        : DEFAULT_DRAFT.outputs,
      budgetItems: Array.isArray(parsed.budgetItems)
        ? parsed.budgetItems.filter(Boolean)
        : DEFAULT_DRAFT.budgetItems,
      attachments: Array.isArray(parsed.attachments)
        ? parsed.attachments.filter(Boolean)
        : DEFAULT_DRAFT.attachments,
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function persistDraft(draft: ProposalDraftForm) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadStep(): StepKey {
  const raw = localStorage.getItem(STORAGE_STEP_KEY);
  if (raw === "essentials" || raw === "plan" || raw === "budget") return raw;
  return "review";
}

export function persistStep(step: StepKey) {
  localStorage.setItem(STORAGE_STEP_KEY, step);
}

export function loadTemplateId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_TEMPLATE_KEY);
    return raw && raw.trim().length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function persistTemplateId(templateId: string) {
  localStorage.setItem(STORAGE_TEMPLATE_KEY, templateId);
}

export function loadServerDraftId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_SERVER_DRAFT_ID_KEY);
    return raw && raw.trim().length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function persistServerDraftId(draftId: string) {
  localStorage.setItem(STORAGE_SERVER_DRAFT_ID_KEY, draftId);
}

export function clearDraftStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_STEP_KEY);
  localStorage.removeItem(STORAGE_TEMPLATE_KEY);
  localStorage.removeItem(STORAGE_SERVER_DRAFT_ID_KEY);
}

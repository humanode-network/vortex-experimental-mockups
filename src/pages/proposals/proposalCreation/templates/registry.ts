import type { WizardTemplate, WizardTemplateId } from "./types.ts";
import { projectTemplate } from "./project.ts";
import { systemTemplate } from "./system.ts";

export const WIZARD_TEMPLATES: Record<WizardTemplateId, WizardTemplate> = {
  project: projectTemplate,
  system: systemTemplate,
};

export const DEFAULT_WIZARD_TEMPLATE_ID: WizardTemplateId = "project";

export function getWizardTemplate(
  id: string | null | undefined,
): WizardTemplate {
  if (id === "system") return WIZARD_TEMPLATES.system;
  if (id === "project") return WIZARD_TEMPLATES.project;
  return WIZARD_TEMPLATES[DEFAULT_WIZARD_TEMPLATE_ID];
}

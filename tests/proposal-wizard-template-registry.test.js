import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_WIZARD_TEMPLATE_ID,
  WIZARD_TEMPLATES,
  getWizardTemplate,
} from "../src/pages/proposals/proposalCreation/templates/registry.ts";

test("proposal wizard template registry: ids are stable and unique", () => {
  const keys = Object.keys(WIZARD_TEMPLATES);
  assert.ok(keys.length > 0);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.includes(DEFAULT_WIZARD_TEMPLATE_ID));
});

test("proposal wizard project template has the expected step order", () => {
  const template = getWizardTemplate("project");
  assert.equal(template.id, "project");
  assert.deepEqual(template.stepOrder, [
    "essentials",
    "plan",
    "budget",
    "review",
  ]);
  for (const step of template.stepOrder) {
    assert.equal(typeof template.stepTitles[step], "string");
    assert.equal(typeof template.stepTabLabels[step], "string");
  }
});

test("proposal wizard system template skips the budget step", () => {
  const template = getWizardTemplate("system");
  assert.equal(template.id, "system");
  assert.deepEqual(template.stepOrder, ["essentials", "plan", "review"]);
  for (const step of template.stepOrder) {
    assert.equal(typeof template.stepTitles[step], "string");
    assert.equal(typeof template.stepTabLabels[step], "string");
  }
});

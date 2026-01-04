import assert from "node:assert/strict";
import { test } from "node:test";

import { systemTemplate } from "../src/pages/proposals/proposalCreation/templates/system.ts";

test("system wizard: compute does not require project fields", () => {
  const draft = {
    title: "Create Design Chamber",
    chamberId: "general",
    summary: "",
    what: "",
    why: "",
    how: "Apply the change after approval and announce.",
    metaGovernance: {
      action: "chamber.create",
      chamberId: "design",
      title: "Design chamber",
      multiplier: 3,
      genesisMembers: [],
    },
    timeline: [],
    outputs: [],
    budgetItems: [],
    aboutMe: "",
    attachments: [],
    agreeRules: true,
    confirmBudget: true,
  };
  const computed = systemTemplate.compute(draft, { budgetTotal: 0 });
  assert.equal(computed.essentialsValid, true);
  assert.equal(computed.planValid, true);
  assert.equal(computed.canSubmit, true);
});

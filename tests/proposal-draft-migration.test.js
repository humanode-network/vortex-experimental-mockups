import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clearProposalDraftsForTests,
  listDrafts,
  seedLegacyDraftForTests,
} from "../functions/_lib/proposalDraftsStore.ts";

test("proposal drafts: legacy project payloads infer templateId", async () => {
  clearProposalDraftsForTests();

  seedLegacyDraftForTests({
    authorAddress: "5TestAddr",
    draftId: "draft-legacy-project",
    title: "Legacy Project Draft",
    chamberId: "engineering",
    summary: "Legacy summary",
    payload: {
      title: "Legacy Project Draft",
      chamberId: "engineering",
      summary: "Legacy summary",
      what: "What: build something.",
      why: "Why: governance needs it.",
      how: "How: step 1.",
      timeline: [{ id: "ms-1", title: "Milestone 1", timeframe: "2 weeks" }],
      outputs: [{ id: "out-1", label: "Docs", url: "" }],
      budgetItems: [{ id: "b-1", description: "Work", amount: "1000" }],
      aboutMe: "",
      attachments: [],
      agreeRules: true,
      confirmBudget: true,
    },
  });

  const drafts = await listDrafts(
    {},
    { authorAddress: "5TestAddr", includeSubmitted: true },
  );
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].payload.templateId, "project");
});

test("proposal drafts: legacy system payloads infer templateId + defaults", async () => {
  clearProposalDraftsForTests();

  seedLegacyDraftForTests({
    authorAddress: "5TestAddr",
    draftId: "draft-legacy-system",
    title: "Legacy System Draft",
    chamberId: "general",
    summary: "",
    payload: {
      title: "Legacy System Draft",
      chamberId: "general",
      metaGovernance: {
        action: "chamber.create",
        chamberId: "design",
        title: "Design chamber",
      },
      agreeRules: true,
      confirmBudget: true,
    },
  });

  const drafts = await listDrafts(
    {},
    { authorAddress: "5TestAddr", includeSubmitted: true },
  );
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].payload.templateId, "system");
  assert.equal(drafts[0].payload.summary, "");
  assert.deepEqual(drafts[0].payload.timeline, []);
});

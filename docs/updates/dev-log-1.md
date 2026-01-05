# Dev Log #1 — Vortex Simulator v0.1

**Date:** 2025-12-24

## Release scope

This release merges the entire `dev` branch into `master` as **Vortex Simulator v0.1**. It covers every simulator domain that has evolved since the last published release: the proposal wizard, chamber lifecycle, gating/quorum logic, canonical read models, admin tooling, docs/tests, and the blog-ready narrative. It now serves as the single source of truth for what changed between the previous shipping baseline (`origin/master` prior to this merge) and the current simulator.

## Key differences vs. previous master

- **Proposal & chamber flows** — New metadata, canonical read models, and stage transitions mean system proposals skip Formation, automatically spawn chambers (with genesis membership), and show up in `/chambers` immediately.
- **Chambers & quorums** — Passed proposals chart a path through the new quorum engine (active-governor denominators, strict 66.6%+1 passing rule), while veto slots, CM awards, and formation seeds consistently rely on the canonical vote state.
- **Docs & storytelling** — Everything now resides under `docs/updates`, and this Dev Log is the single source of truth for release notes, blog drafts, and the phase-aligned implementation plan.

## What end users will notice

- A **streamlined chamber wizard**: when you select “system change,” the form dynamically surfaces only the fields needed for a chamber create/dissolve proposal, enforces the new validation rules, and persists the meta-governance payload so the back end knows it’s a chamber action.
- A **faster proposal lifecycle**: attention votes, chamber votes, and passing tracking now operate with real-time denominators, so the UI always shows accurate quorum percentages. When a chamber-related proposal passes, the next CTA lands you inside the new chamber instead of Formation.
- **Chamber discoverability**: `/app/chambers` now reflects newly created or dissolved chambers immediately, even in the local read-model mode, because we patch the read-model store as part of the vote acceptance flow.
- **Better release transparency**: this document (Dev Log #1) is the canonical release note and blog-ready summary — every notable change is covered here so the blog post can simply refer to it for the fine-grained details.

## Technical changes (for reference)

- **Formation gating** now derives `formationEligible` from the payload/read model so meta-governance proposals bypass Formation and instead create/dissolve chambers directly from the read model store (both inline and real DB). The canonical `finalizeAcceptedProposalFromVote` path seeds chambers + memberships for metaproposals.
- **Read-model resilience** — chamber and proposal endpoints fall back to the in-memory read models, and new chamber creations update `chambers:list` plus per-chamber entries so the UI sees new chambers before persistence exists.
- **Chamber lifecycle automation** — `maybeAdvanceVoteProposalToBuild` inspects `metaGovernance`, calls `createChamberFromAcceptedGeneralProposal`/`dissolveChamberFromAcceptedGeneralProposal`, and updates the read models; genesis members plus proposers automatically join newly created chambers.
- **Proposal creation cleanup** — normalized chamber IDs, meta-governance validation, and stored payloads ensure the new flows work offline. The stage transition feed/timeline now references the correct chamber action.
- **Admin & docs** — new `docs/updates/dev-log-1.md` now records the entire release; the README links have been refreshed to point at this summary, and the old extra dev log drafts were removed per the new single-doc rule.

## Commit appendix

Major commits included (hash + title):

1. `57b4d64` — Doc grouping and updates (read-model docs reorganized).
2. `6f607a0` & `c0c32a5` — Proposal wizard refactors (meta payloads + drafts).
3. `e99dbb7`/`1f7a04f` — HMND canonicalization + wizard plans.
4. `dad0a22` … `3ac134a` — Quorum engine overhauls, governor eligibility, doc alignment.
5. `f152962`/`3a740e1`/`69b4057` — Thresholds, attention quorum, chamber-multiplier voting.
6. `e48962c`/`9589ccc` — Veto implementation and CM/quorum snapshot stability.
7. `1c7d90b` … `10843a1` — Phase 26–27 moves (event-driven timeline, canonical read models, stage windows).
8. `52deba7` … `26534b0` — Proposal UI unification, system wizard, draft-based creation.
9. `414f85a` … `e1b3377` — Chamber detail modeling, membership seeding, plan-phase doc alignments.
10. earlier phases (phase 11–24) — foundational era snapshots, courts, formation, events, gating, admin tooling.

Each of those commits either added new simulator behavior, rewired an API surface, or refreshed the docs so the release note matches the current state.

# Vortex Simulation: Proposal Wizard Architecture

This document defines the long-term structure for the proposal creation wizard so that different proposal types can have different flows, while still producing a single canonical “proposal draft” payload that the backend can validate and submit.

## Goals

- Support multiple proposal types with different required fields and step flows.
- Keep the UI scalable (adding a new proposal type should not require rewriting the whole wizard).
- Ensure the backend enforces the same rules as the UI (single source of truth for draft validation).
- Make “system-change” proposals (e.g., chamber creation) reflect the exact data they mutate in the simulation.

## Proposal Kind vs. Proposal Rights

There are two separate axes:

1. **Proposal rights / tier gating** (Basic, Administrative, Fee, etc.)

- This is about _who can submit what_, based on tier/rights rules.

2. **Proposal kind (wizard + payload shape)**

- This is about _what the proposal does to the simulation_ and therefore what fields the wizard should collect.

This document focuses on (2).

## Canonical Model: Discriminated Draft Union

All drafts should include a discriminant that selects the template and payload shape:

- `kind: "project"` — proposals that represent work/projects; may or may not require Formation.
- `kind: "system"` — proposals that directly change simulation state (system variables/entities).

For `kind: "system"`, the `systemAction` (or similar) further specifies the exact system mutation, for example:

- `systemAction: "chamber.create"`
- `systemAction: "chamber.dissolve"`

The draft payload becomes a discriminated union in both places:

- Frontend draft state (wizard)
- Backend validation (`functions/_lib/proposalDraftsStore.ts`)

## Template Registry (Wizard Definition)

The wizard should be driven by a registry of templates (one per proposal flow).

Each template defines:

- `id` — stable template identifier (e.g. `project`, `system.chamberCreate`)
- `label` and `description` — used in the initial “choose type” screen
- `steps: StepDef[]` — ordered steps, each with `id`, `title`, and a component to render
- `validateStep(draft, stepId)` — step-level validation (for inline error display)
- `isSubmittable(draft)` — final gate for “Submit”
- `toApiForm(draft)` — maps the template-specific draft into the canonical API payload

Suggested folder layout:

- `src/pages/proposals/proposalCreation/templates/`
  - `project.ts`
  - `system.chamberCreate.ts`
  - `system.chamberDissolve.ts` (later)
- `src/pages/proposals/proposalCreation/steps/` (shared step components)

The main wizard page (`src/pages/proposals/ProposalCreation.tsx`) should become “template runner” glue:

- Determine current template (from query param / initial choice / saved draft)
- Render the template’s current step component
- Persist draft state and step
- Call `apiProposalDraftSave` and `apiProposalSubmitToPool` using `template.toApiForm(draft)`

## Flow: System Proposal — Chamber Creation

Chamber creation is a **system-change** proposal, and in the simulation it is only valid as a **General chamber** proposal (the wizard should force `chamberId = "general"`).

### Template ID

- `system.chamberCreate`

### Steps

1. **Chamber details** (defines what will appear in the chamber card + chamber page identity)
   - `metaGovernance.action = "chamber.create"`
   - `metaGovernance.chamberId` (new chamber id/slug)
   - `metaGovernance.title` (display title)
   - `metaGovernance.multiplier` (initial multiplier)
   - `summary` (short “why this chamber should exist”)

2. **Genesis members (bootstrap)**
   - `metaGovernance.genesisMembers: string[]` (HMND addresses)
   - Optional: if omitted, the proposer still becomes a member on acceptance.

3. **Review & submit**
   - Show exactly what will happen on acceptance:
     - a new chamber entity is created
     - proposer + genesis members become chamber members

### What is intentionally NOT collected

- Budget
- Formation eligibility
- Milestones / timeline
- Outputs

Those are meaningful for projects, not for creating the chamber entity itself.

### Backend integration point

On acceptance (General chamber, vote → build), the backend already finalizes system actions:

- `functions/_lib/proposalFinalizer.ts`
  - `createChamberFromAcceptedGeneralProposal(...)`
  - membership seeding from `metaGovernance.genesisMembers` + proposer

The wizard’s responsibility is to produce the correct `metaGovernance` payload only.

## Flow: Project Proposal — Normal Proposal Creation

This is the “general” proposal creation flow used for proposals that represent work.

### Template ID

- `project`

### Steps (v1)

1. **Essentials**
   - `title`
   - `chamberId` (target chamber pool)
   - `summary`
   - `what`
   - `why`
   - Optional: `aboutMe`

2. **Plan**
   - `how`
   - `timeline[]` (milestones)
   - `outputs[]`
   - `attachments[]` (recommended)

3. **Budget & Formation**
   - `formationEligible` (explicit field, if/when we stop inferring it)
   - `budgetItems[]`
   - confirmations: `agreeRules`, `confirmBudget`

4. **Review & submit**
   - “Save draft” always available
   - “Submit” enabled only when `isSubmittable(draft)` passes

### Backend integration point

Project proposals are submitted from drafts via:

- `functions/api/command.ts` (`proposal.submitToPool`)
- draft storage + validation:
  - `functions/_lib/proposalDraftsStore.ts` (`proposalDraftFormSchema`, `draftIsSubmittable`)

## Address Handling (HMND)

All addresses should be treated as Humanode (HMND) SS58 strings.

Rules:

- Persist and display canonical addresses as `hm...` (Humanode SS58 format).
- Compare addresses by decoded public key, not by raw string, to avoid SS58 prefix mismatches.

Implementation helpers:

- `functions/_lib/address.ts`
  - `HUMANODE_SS58_FORMAT = 5234`
  - `canonicalizeHmndAddress(address)`
  - `addressesReferToSameKey(a, b)`

## Implementation phases (Wizard v2 track)

The wizard refactor is intentionally staged so the UI can stay usable while the draft schema evolves.

### W1 — Template runner + registry (plumbing)

- Introduce a template registry (`templates/*`) and make `ProposalCreation.tsx` a template runner.
- Keep the existing “project” flow behavior but move orchestration behind a template interface.
- Persist the selected template id in draft storage (local + server draft payload).

Tests:

- Minimal unit test for template registry invariants (unique ids, stable step ordering).

### W2 — System template: `system.chamberCreate`

- Implement the dedicated chamber-creation flow:
  - force `chamberId = "general"`
  - collect only chamber-defining fields + optional genesis members
- Map the system template into the existing backend payload (`metaGovernance`) so no backend finalizer changes are required.

Tests:

- API scenario test: create chamber.create draft → submit to pool → pass quorum/vote → chamber appears in `/api/chambers`.

### W3 — Split the backend draft schema into a discriminated union

- Convert the backend draft payload (`proposalDraftFormSchema`) into a discriminated union matching template ids.
- Keep a compatibility adapter for old drafts until they are migrated/cleared.

Tests:

- Schema-level tests:
  - old draft payloads still parse (compat mode)
  - new template payloads parse and enforce the correct required fields

### W4 — Migrate stored drafts + simplify project validation

- Migrate persisted drafts (DB + local storage) to the new discriminated shape where feasible.
- Remove “fake” required fields for system proposals and remove “system-only” branching from the project flow.

Tests:

- Draft submit tests for both `project` and `system.chamberCreate` (required fields + chamber constraints).

### W5 — Cleanup + extension points

- Remove legacy branches and deprecate the old “single big form” shape.
- Add extension points for additional system actions (e.g., `system.chamberDissolve`) without inflating the base project flow.

Tests:

- Coverage stays stable (no feature regression in `proposal.draft.save` / `proposal.submitToPool` / proposal pages).

## Migration Notes (from current shape)

Current state uses a “single big form” with `metaGovernance` optional (see `functions/_lib/proposalDraftsStore.ts`).

To migrate cleanly:

1. Introduce the discriminant (`kind` + template id).
2. Split the backend draft schema into a discriminated union.
3. Keep a compatibility adapter temporarily (if needed) that maps old drafts into `kind: "project"` until old drafts are gone.

## Definition of “Done” for this refactor

- The wizard supports at least:
  - `project`
  - `system.chamberCreate`
- `system.chamberCreate` does not show project-only steps/fields.
- Backend validation matches the template rules (no fake required fields).
- Submitting a chamber creation proposal produces a payload that the finalizer can apply without extra UI hacks.

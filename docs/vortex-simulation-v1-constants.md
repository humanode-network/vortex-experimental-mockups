# Vortex Simulation Backend — v1 Constants (Locked Decisions)

This file records the **locked v1 decisions** from Phase 0 so later implementation and tests can treat them as source-of-truth.

## Stack decisions

- **Database:** Postgres (v1 recommendation: **Neon**, for edge/serverless connectivity)
- **On-chain read source:** Humanode mainnet RPC (no Subscan dependency for v1)
- **Eligibility (“active Human Node”):** active via the chain’s `im_online` pallet (online reporting / heartbeat)

## Simulation time decisions

- **Era length:** configured off-chain by the simulation (not a chain parameter)
  - v1 value: **TBD** (we will set it as a constant/env var when adding the clock/rollups)

## Current v1 progress checkpoints

- Phase 2 (backend scaffold) exists in the repo (`functions/`, DB schema/migrations under `db/`, seed script under `scripts/`).
- Read endpoints are not wired to Postgres yet; the first implementation will serve from `read_models` to match the API contract.

export const V1_ACTIVE_GOVERNORS_FALLBACK = 150;

// The simulation's default era length (used by Phase 16 automation).
// This does not come from chain state; it's an off-chain simulation constant.
export const V1_ERA_SECONDS_DEFAULT = 7 * 24 * 60 * 60; // 7 days

export const V1_POOL_STAGE_SECONDS_DEFAULT = 7 * 24 * 60 * 60; // 7 days
export const V1_VOTE_STAGE_SECONDS_DEFAULT = 3 * 24 * 60 * 60; // 3 days

export const V1_POOL_ATTENTION_QUORUM_FRACTION = 0.2;
export const V1_POOL_UPVOTE_FLOOR_FRACTION = 0.1;

export const V1_CHAMBER_QUORUM_FRACTION = 0.33;
export const V1_CHAMBER_PASSING_FRACTION = 2 / 3; // 66.6%

// Veto (temporary slow-down) (Phase 30).
// If the veto threshold is met, the proposal returns to chamber voting after a delay.
export const V1_VETO_PASSING_FRACTION = 2 / 3; // 66.6% + 1 (rounded per council size)
export const V1_VETO_DELAY_SECONDS_DEFAULT = 14 * 24 * 60 * 60; // 2 weeks
export const V1_VETO_MAX_APPLIES = 2;

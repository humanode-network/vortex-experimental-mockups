import type { ProposalStage } from "./proposalsStore.ts";
import {
  V1_POOL_STAGE_SECONDS_DEFAULT,
  V1_VOTE_STAGE_SECONDS_DEFAULT,
} from "./v1Constants.ts";

type Env = Record<string, string | undefined>;

export function getSimNow(env: Env): Date {
  const raw = env.SIM_NOW_ISO ?? "";
  if (raw.trim().length > 0) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function stageWindowsEnabled(env: Env): boolean {
  return env.SIM_ENABLE_STAGE_WINDOWS === "true";
}

export function getStageWindowSeconds(env: Env, stage: ProposalStage): number {
  const raw =
    stage === "pool"
      ? env.SIM_POOL_WINDOW_SECONDS
      : stage === "vote"
        ? env.SIM_VOTE_WINDOW_SECONDS
        : null;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);

  return stage === "pool"
    ? V1_POOL_STAGE_SECONDS_DEFAULT
    : stage === "vote"
      ? V1_VOTE_STAGE_SECONDS_DEFAULT
      : 0;
}

export function getStageDeadlineIso(input: {
  stageStartedAt: Date;
  windowSeconds: number;
}): string {
  const ms =
    input.stageStartedAt.getTime() + Math.max(0, input.windowSeconds) * 1000;
  return new Date(ms).toISOString();
}

export function getStageRemainingSeconds(input: {
  now: Date;
  stageStartedAt: Date;
  windowSeconds: number;
}): number {
  const msRemaining =
    input.stageStartedAt.getTime() +
    Math.max(0, input.windowSeconds) * 1000 -
    input.now.getTime();
  return Math.max(0, Math.floor(msRemaining / 1000));
}

export function formatTimeLeftDaysHours(remainingSeconds: number): string {
  const seconds = Math.max(0, Math.floor(remainingSeconds));
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  return `${days}d ${String(hours).padStart(2, "0")}h`;
}

export function isStageOpen(input: {
  now: Date;
  stageStartedAt: Date;
  windowSeconds: number;
}): boolean {
  return (
    input.now.getTime() >= input.stageStartedAt.getTime() &&
    input.now.getTime() <
      input.stageStartedAt.getTime() + Math.max(0, input.windowSeconds) * 1000
  );
}

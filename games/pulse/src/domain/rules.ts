import type { GameState, Random } from "./types";

export const TAU = Math.PI * 2;
const START_ANGLE = -Math.PI / 2;
const START_TARGET = 0.22;

export function normalize(angle: number): number {
  if (!Number.isFinite(angle)) return 0;
  return ((angle % TAU) + TAU) % TAU;
}

export function angularDistance(a: number, b: number): number {
  const d = Math.abs(normalize(a) - normalize(b));
  return Math.min(d, TAU - d);
}

export function createGame(): GameState {
  return {
    phase: "ready",
    angle: normalize(START_ANGLE),
    target: START_TARGET,
    halfWindow: 0.47,
    speed: 1.5,
    direction: 1,
    hits: 0,
    score: 0,
    perfects: 0,
    lastResult: null,
  };
}

export function start(state: GameState): GameState {
  return state.phase === "ready" || state.phase === "paused"
    ? { ...state, phase: "running", lastResult: null }
    : state;
}

export function pause(state: GameState): GameState {
  if (state.phase === "running") return { ...state, phase: "paused" };
  if (state.phase === "paused") return { ...state, phase: "running" };
  return state;
}

export function advance(state: GameState, elapsedSeconds: number): GameState {
  if (state.phase !== "running") return state;
  // Large background-tab deltas cannot silently skip a target.
  const elapsed = Number.isFinite(elapsedSeconds)
    ? Math.min(0.05, Math.max(0, elapsedSeconds))
    : 0;
  return {
    ...state,
    angle: normalize(state.angle + state.direction * state.speed * elapsed),
  };
}

export function difficulty(hits: number): {
  speed: number;
  halfWindow: number;
} {
  const value = Math.max(0, Number.isFinite(hits) ? hits : 0);
  return {
    speed: Math.min(2.75, 1.5 + value * 0.048),
    halfWindow: Math.max(0.19, 0.47 - value * 0.012),
  };
}

function randomFraction(random: Random): number {
  const value = random();
  return Number.isFinite(value) ? Math.min(0.999999, Math.max(0, value)) : 0.5;
}

export function tap(state: GameState, random: Random): GameState {
  if (state.phase !== "running") return state;
  const error = angularDistance(state.angle, state.target);
  if (error > state.halfWindow) {
    return { ...state, phase: "lost", lastResult: "miss" };
  }
  const perfect = error <= state.halfWindow * 0.28;
  const hits = state.hits + 1;
  const nextDirection = state.direction === 1 ? -1 : 1;
  // Every new target is positioned 1.15–2.45 radians ahead in the
  // newly reversed direction. This guarantees time for anticipation.
  const distance = 1.15 + randomFraction(random) * 1.3;
  return {
    ...state,
    ...difficulty(hits),
    phase: "running",
    direction: nextDirection,
    target: normalize(state.angle + nextDirection * distance),
    score: state.score + (perfect ? 2 : 1),
    hits,
    perfects: state.perfects + (perfect ? 1 : 0),
    lastResult: perfect ? "perfect" : "good",
  };
}

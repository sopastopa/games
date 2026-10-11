import { describe, expect, it } from "vitest";
import { nextStep, START, type Point } from "../../src/domain/map";
import {
  createGame,
  distance,
  IDLE,
  objectiveReady,
  stepGame,
  type GameState,
} from "../../src/domain/rules";

function walk(state: GameState, goal: Point): GameState {
  let current = state;
  for (
    let tick = 0;
    tick < 4000 && distance(current.player, goal) > 0.19;
    tick++
  ) {
    const from = {
      x: Math.round(current.player.x),
      y: Math.round(current.player.y),
    };
    const next = nextStep(current.arena, from, goal, current.opened);
    const destination = next ?? goal;
    const x = destination.x - current.player.x;
    const y = destination.y - current.player.y;
    if (Math.hypot(x, y) < 0.001) throw new Error("No route to destination");
    current = stepGame(current, {
      ...IDLE,
      moveX: x,
      moveY: y,
    });
    if (current.phase === "cleared" && distance(current.player, goal) < 0.85)
      break;
    if (current.phase !== "playing")
      throw new Error("Mission ended prematurely");
  }
  if (
    distance(current.player, goal) > (current.phase === "cleared" ? 0.85 : 0.19)
  )
    throw new Error("Path blocked: " + JSON.stringify(goal));
  return current;
}

function charge(state: GameState): GameState {
  let current = state;
  for (let i = 0; i < 70; i++) current = stepGame(current, IDLE);
  return current;
}

describe("actual door-and-relay mission", () => {
  it("can traverse every district with physical movement and finish", () => {
    let state: GameState = {
      ...createGame(17),
      phase: "playing",
      enemies: [], // Isolate navigation from combat for this campaign route.
    };
    expect(state.player).toMatchObject(START);
    state = walk(state, { x: 15, y: 5 });
    expect(state.keys).toContain("rose");
    state = walk(state, { x: 5, y: 15 });
    expect(state.keys).toContain("cyan");

    state = walk(state, { x: 19, y: 5 });
    state = stepGame(state, { ...IDLE, interact: true });
    expect(state.opened).toContain("rose");
    state = walk(state, state.relays[0]!);
    state = charge(state);
    expect(state.relays[0]!.charge).toBe(100);

    state = walk(state, { x: 5, y: 19 });
    state = stepGame(state, { ...IDLE, interact: true });
    expect(state.opened).toContain("cyan");
    state = walk(state, state.relays[1]!);
    state = charge(state);
    expect(state.relays[1]!.charge).toBe(100);

    state = walk(state, { x: 19, y: 25 });
    state = stepGame(state, { ...IDLE, interact: true });
    expect(state.opened).toContain("core");
    state = walk(state, state.relays[2]!);
    state = charge(state);
    expect(state.relays[2]!.charge).toBe(100);
    expect(objectiveReady(state)).toBe(true);

    state = walk(state, state.arena.exit);
    state = stepGame(state, IDLE);
    expect(state.phase).toBe("cleared");
    expect(state.score).toBeGreaterThanOrEqual(1200);
  });
});

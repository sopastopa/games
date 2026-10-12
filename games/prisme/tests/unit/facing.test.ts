import { describe, expect, it } from "vitest";
import { createGame, IDLE, stepGame, type GameState } from "../../src/domain/rules";

describe("pilot visual orientation", () => {
  it("starts facing right and follows the last keyboard or joystick movement", () => {
    let state: GameState = { ...createGame(12345), phase: "playing" as const };
    expect(state.player.facing).toEqual({ x: 1, y: 0 });

    state = stepGame(state, { ...IDLE, moveY: -1 });
    expect(state.player.facing).toEqual({ x: 0, y: -1 });

    state = stepGame(state, IDLE);
    expect(state.player.facing).toEqual({ x: 0, y: -1 });

    state = stepGame(state, { ...IDLE, moveX: -0.8, moveY: 0 });
    expect(state.player.facing).toEqual({ x: -1, y: 0 });
  });

  it("uses the firing direction only while actively firing", () => {
    let state: GameState = { ...createGame(8675309), phase: "playing" as const };
    state = stepGame(state, { ...IDLE, moveY: -1 });
    state = stepGame(state, {
      ...IDLE,
      moveY: -1,
      shoot: true,
      aimX: 0,
      aimY: 1,
    });
    expect(state.player.facing).toEqual({ x: 0, y: 1 });

    state = stepGame(state, { ...IDLE, moveY: -1, aimX: 1, aimY: 0 });
    expect(state.player.facing).toEqual({ x: 0, y: -1 });
  });

  it("normalizes diagonals and preserves facing through pause", () => {
    let state: GameState = { ...createGame(7777), phase: "playing" as const };
    state = stepGame(state, { ...IDLE, moveX: 1, moveY: 1 });
    expect(state.player.facing.x).toBeCloseTo(Math.SQRT1_2);
    expect(state.player.facing.y).toBeCloseTo(Math.SQRT1_2);

    const paused = { ...state, phase: "paused" as const };
    expect(stepGame(paused, { ...IDLE, moveX: -1 })).toBe(paused);
    expect(paused.player.facing).toEqual(state.player.facing);
  });
});

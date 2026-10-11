import { describe, expect, it } from "vitest";
import { MAX_ZONE } from "../../src/domain/map";
import {
  bestAim,
  createGame,
  distance,
  IDLE,
  objectiveReady,
  stepGame,
  type GameState,
} from "../../src/domain/rules";

function playing(seed = 17): GameState {
  return { ...createGame(seed), phase: "playing" };
}

describe("PRISME simulation", () => {
  it("starts safely in ready state and advances only while playing", () => {
    const ready = createGame(17);
    expect(ready.phase).toBe("ready");
    expect(ready.player.hp).toBe(6);
    expect(stepGame(ready, IDLE)).toBe(ready);
    const paused = { ...ready, phase: "paused" as const };
    expect(stepGame(paused, IDLE)).toBe(paused);
  });

  it("moves, obeys wall collisions and never escapes the arena", () => {
    let state = playing();
    const start = state.player.x;
    for (let i = 0; i < 240; i++) {
      state = stepGame(state, { ...IDLE, moveX: -1 });
    }
    expect(state.player.x).toBeLessThan(start);
    expect(state.player.x).toBeGreaterThan(0);
  });

  it("fires toward an enemy, damages it and counts the elimination", () => {
    let state = playing();
    state = {
      ...state,
      enemies: [{ id: 0, x: 7, y: 6, hp: 1, timer: 500 }],
    };
    expect(bestAim(state).x).toBeGreaterThan(0);
    for (let i = 0; i < 12; i++) {
      state = stepGame(state, { ...IDLE, aimX: 1, aimY: 0, shoot: true });
    }
    expect(state.enemies).toHaveLength(0);
    expect(state.score).toBe(100);
  });

  it("requires cooling between volleys and has finite dash duration", () => {
    let state = { ...playing(), enemies: [] };
    for (let i = 0; i < 120; i++) {
      state = stepGame(state, { ...IDLE, shoot: true });
    }
    expect(state.player.heat).toBeGreaterThan(0);
    expect(state.player.heat).toBeLessThanOrEqual(100);
    state = stepGame(state, { ...IDLE, dash: true, moveY: 1 });
    expect(state.player.dashCooldown).toBe(120);
    expect(state.player.dashTime).toBe(8);
    for (let i = 0; i < 10; i++) state = stepGame(state, IDLE);
    expect(state.player.dashTime).toBe(0);
    expect(state.player.dashCooldown).toBe(110);
  });

  it("captures relays only from nearby, healing once on completion", () => {
    let state = { ...playing(), enemies: [] };
    const relay = state.relays[0];
    state = {
      ...state,
      player: { ...state.player, x: relay.x, y: relay.y, hp: 3 },
    };
    for (let i = 0; i < 70; i++) state = stepGame(state, IDLE);
    expect(state.relays[0].charge).toBe(100);
    expect(state.player.hp).toBe(4);
    expect(state.score).toBe(200);
    for (let i = 0; i < 10; i++) state = stepGame(state, IDLE);
    expect(state.player.hp).toBe(4);
  });

  it("cannot extract before all relays are captured and all sentinels are gone", () => {
    let state = playing();
    state = {
      ...state,
      player: { ...state.player, ...state.arena.exit },
    };
    state = stepGame(state, IDLE);
    expect(objectiveReady(state)).toBe(false);
    expect(state.phase).toBe("playing");
    state = {
      ...state,
      enemies: [],
      relays: state.relays.map((relay) => ({ ...relay, charge: 100 })),
    };
    expect(objectiveReady(state)).toBe(true);
    expect(stepGame(state, IDLE).phase).toBe("cleared");
    const final = { ...state, zone: MAX_ZONE };
    expect(stepGame(final, IDLE).phase).toBe("won");
  });

  it("loses when hull reaches zero, with invulnerability preventing rapid repeats", () => {
    const state = playing();
    const bullet = {
      x: state.player.x - 0.2,
      y: state.player.y,
      dx: 0.2,
      dy: 0,
      hostile: true,
      life: 20,
    };
    const damaged = stepGame(
      {
        ...state,
        player: { ...state.player, hp: 2 },
        enemies: [],
        shots: [bullet],
      },
      IDLE,
    );
    expect(damaged.player.hp).toBe(1);
    expect(damaged.player.invulnerable).toBeGreaterThan(0);
    const blocked = stepGame(
      { ...damaged, shots: [bullet] },
      IDLE,
    );
    expect(blocked.player.hp).toBe(1);
    const lost = stepGame(
      {
        ...damaged,
        player: { ...damaged.player, hp: 1, invulnerable: 0 },
        shots: [bullet],
      },
      IDLE,
    );
    expect(lost.phase).toBe("lost");
  });

  it("keeps original state immutable and exposes deterministic aim", () => {
    const previous = playing();
    const snapshot = structuredClone(previous);
    const next = stepGame(previous, IDLE);
    expect(previous).toEqual(snapshot);
    expect(next.tick).toBe(1);
    expect(distance(previous.player, next.player)).toBe(0);
    expect(bestAim(previous)).toEqual(bestAim(previous));
  });
});

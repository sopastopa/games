import { describe, expect, it } from "vitest";
import { MAX_ZONE, START } from "../../src/domain/map";
import {
  availableGate,
  bestAim,
  canOpenGate,
  createGame,
  distance,
  IDLE,
  objectiveReady,
  stepGame,
  type GameState,
  type Shot,
} from "../../src/domain/rules";

function playing(seed = 17): GameState {
  return { ...createGame(seed), phase: "playing" };
}

describe("PRISME tactical simulation", () => {
  it("starts safe, deterministic and advances only while playing", () => {
    const ready = createGame(17);
    expect(ready.phase).toBe("ready");
    expect(ready.player.hp).toBe(6);
    expect(ready.enemies.length).toBeGreaterThan(5);
    expect(stepGame(ready, IDLE)).toBe(ready);
    expect(stepGame({ ...ready, phase: "planning" }, IDLE).tick).toBe(0);
  });

  it("moves in a larger world, collides and does not mutate original state", () => {
    const original = playing();
    const snapshot = structuredClone(original);
    let state = original;
    for (let i = 0; i < 160; i++) {
      state = stepGame(state, { ...IDLE, moveX: -1 });
    }
    expect(state.player.x).toBeLessThan(START.x);
    expect(state.player.x).toBeGreaterThan(0);
    expect(original).toEqual(snapshot);
  });

  it("uses three distinct weapons and eliminates enemies with hits", () => {
    for (const weapon of ["pulse", "scatter", "rail"] as const) {
      let state: GameState = {
        ...playing(),
        player: { ...playing().player, weapon },
        enemies: [{
          id: 0, kind: "hunter", x: 7, y: 5, hp: 3,
          timer: 500, alert: 0, target: null,
        }],
      };
      for (let i = 0; i < 40; i++) {
        state = stepGame(state, { ...IDLE, aimX: 1, aimY: 0, shoot: true });
      }
      expect(state.enemies).toHaveLength(0);
      expect(state.score).toBe(100);
      expect(state.player.heat).toBeGreaterThan(0);
    }
  });

  it("limits heat, consumes dash and respects invulnerability", () => {
    let state: GameState = { ...playing(), enemies: [] };
    for (let i = 0; i < 120; i++) state = stepGame(state, { ...IDLE, shoot: true });
    expect(state.player.heat).toBeLessThanOrEqual(100);
    state = stepGame(state, { ...IDLE, dash: true, moveY: 1 });
    expect(state.player.dashCooldown).toBe(120);
    expect(state.player.dashTime).toBe(8);
    for (let i = 0; i < 10; i++) state = stepGame(state, IDLE);
    expect(state.player.dashTime).toBe(0);
  });

  it("gates open only when their associated keys or power are ready", () => {
    let state = playing();
    state = {
      ...state,
      player: { ...state.player, x: 19, y: 5 },
    };
    expect(availableGate(state)).toBe("rose");
    expect(canOpenGate(state, "rose")).toBe(false);
    state = stepGame(state, { ...IDLE, interact: true });
    expect(state.opened).not.toContain("rose");
    expect(state.notice).toContain("ACCÈS REFUSÉ");
    state = { ...state, keys: ["rose"] };
    state = stepGame(state, { ...IDLE, interact: true });
    expect(state.opened).toContain("rose");
    state = {
      ...state,
      player: { ...state.player, x: 25, y: 19 },
      keys: ["rose", "cyan"],
    };
    expect(canOpenGate(state, "core")).toBe(false);
    state = { ...state, relays: state.relays.map((relay, i) => ({
      ...relay, charge: i < 2 ? 100 : 0,
    })) };
    expect(canOpenGate(state, "core")).toBe(true);
    state = stepGame(state, { ...IDLE, interact: true });
    expect(state.opened).toContain("core");
  });

  it("collects keycards, armor, weapons and battery without blocking exits", () => {
    let state: GameState = { ...playing(), enemies: [] };
    const key = state.pickups.find((item) => item.kind === "key-rose")!;
    state = {
      ...state, player: { ...state.player, x: key.x, y: key.y },
    };
    state = stepGame(state, IDLE);
    expect(state.keys).toContain("rose");
    expect(state.pickups.some((item) => item.id === key.id)).toBe(false);
    const armor = state.pickups.find((item) => item.kind === "armor")!;
    state = {
      ...state, player: { ...state.player, x: armor.x, y: armor.y },
    };
    state = stepGame(state, IDLE);
    expect(state.player.armor).toBe(2);
    for (const weapon of ["scatter", "rail"] as const) {
      const existing = { id: 333, x: 5, y: 5, kind: weapon };
      state = {
        ...state,
        pickups: [...state.pickups, existing],
        player: { ...state.player, x: existing.x, y: existing.y },
      };
      state = stepGame(state, IDLE);
      expect(state.player.weapon).toBe(weapon);
    }
  });

  it("scanning discovers terrain but never exposes hidden enemies", () => {
    let state: GameState = { ...playing(), enemies: [] };
    const explored = state.explored.filter(Boolean).length;
    state = stepGame(state, { ...IDLE, scan: true });
    expect(state.player.scanCharges).toBe(1);
    expect(state.explored.filter(Boolean).length).toBeGreaterThan(explored);
    expect(state.visible[35 * 41 + 35]).toBe(false);
  });

  it("finishes relay capture, heals once and requires cleared map for exit", () => {
    let state: GameState = { ...playing(), enemies: [] };
    const relay = state.relays[0]!;
    state = { ...state, player: { ...state.player, ...relay, hp: 3 } };
    for (let i = 0; i < 70; i++) state = stepGame(state, IDLE);
    expect(state.relays[0]!.charge).toBe(100);
    expect(state.player.hp).toBe(4);
    expect(state.score).toBe(200);
    expect(objectiveReady(state)).toBe(false);
    state = {
      ...state, relays: state.relays.map((item) => ({ ...item, charge: 100 })),
      player: { ...state.player, ...state.arena.exit },
    };
    expect(objectiveReady(state)).toBe(true);
    expect(stepGame(state, IDLE).phase).toBe("cleared");
    expect(stepGame({ ...state, zone: MAX_ZONE }, IDLE).phase).toBe("won");
  });

  it("absorbs hostile shots with armor and prevents repeated damage", () => {
    let state: GameState = { ...playing(), enemies: [], player: {
      ...playing().player, hp: 1, armor: 1,
    } };
    const bullet: Shot = {
      x: state.player.x - 0.2, y: state.player.y,
      dx: 0.2, dy: 0, hostile: true, life: 20,
      damage: 1, pierce: 1, hits: [],
    };
    state = stepGame({ ...state, shots: [bullet] }, IDLE);
    expect(state.player.armor).toBe(0);
    expect(state.player.hp).toBe(1);
    const blocked = stepGame({ ...state, shots: [bullet] }, IDLE);
    expect(blocked.player.hp).toBe(1);
    state = stepGame({
      ...state,
      player: { ...state.player, invulnerable: 0 },
      shots: [bullet],
    }, IDLE);
    expect(state.phase).toBe("lost");
    expect(distance(START, { x: 5, y: 5 })).toBe(0);
    expect(bestAim(createGame(17))).toEqual({ x: 1, y: 0 });
  });
});

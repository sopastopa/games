import { describe, expect, it } from "vitest";
import { distance, shortestPath } from "../../src/domain/generation";
import {
  actionAvailable,
  directionBetween,
  newExpedition,
  tideIsHigh,
  transition,
  validateExpedition,
} from "../../src/domain/rules";
import { EXIT, START, type Expedition } from "../../src/domain/types";

function followPath(run: Expedition, target: number): Expedition {
  const path = shortestPath(run.terrain, run.position, target);
  expect(path.length).toBeGreaterThan(0);
  for (const position of path.slice(1)) {
    const direction = directionBetween(run.position, position)!;
    const next = transition(run, { kind: "move", direction });
    expect(next).not.toBe(run);
    run = next;
    if (run.phase !== "playing") break;
  }
  return run;
}

describe("expedition rules", () => {
  it("starts a playable, valid tutorial without enemies or tides", () => {
    const game = newExpedition(0, 17, "guardian");
    expect(game.position).toBe(START);
    expect(game.phase).toBe("playing");
    expect(game.drones).toHaveLength(0);
    expect(game.revealed[START]).toBe(true);
    expect(validateExpedition(game)).toBe(true);
    expect(() => newExpedition(-1, 1, "scout")).toThrow();
    expect(() => newExpedition(12, 1, "scout")).toThrow();
  });

  it("can actually complete the first mission by collecting cores and reaching the exit", () => {
    let game = newExpedition(0, 17, "guardian");
    const cores = game.terrain.flatMap((tile, index) =>
      tile === "core" ? [index] : [],
    );
    for (const target of cores) game = followPath(game, target);
    expect(game.cores).toBe(game.required);
    game = followPath(game, EXIT);
    expect(game.phase).toBe("won");
    expect(game.position).toBe(EXIT);
    expect(game.turn).toBeGreaterThan(0);
    expect(transition(game, { kind: "wait" })).toBe(game);
  });

  it("does not exit before all cores and never charges invalid moves", () => {
    let game = newExpedition(0, 37, "scout");
    const original = game;
    expect(transition(game, { kind: "move", direction: "up" })).toBe(game);
    game = followPath(game, EXIT);
    expect(game.phase).toBe("playing");
    expect(game.cores).toBeLessThan(game.required);
    expect(original.turn).toBe(0);
    expect(game.turn).toBeGreaterThan(0);
  });

  it("spends energy on scan, reveals hidden tiles and tracks turns", () => {
    const run = newExpedition(2, 99, "scout");
    const after = transition(run, { kind: "scan" });
    expect(after.energy).toBe(run.energy - 1);
    expect(after.turn).toBe(1);
    expect(after.revealed.filter(Boolean).length).toBeGreaterThan(
      run.revealed.filter(Boolean).length,
    );
    expect(run.turn).toBe(0);
    const poor = { ...run, energy: 0 };
    expect(transition(poor, { kind: "scan" })).toBe(poor);
  });

  it("provides role-specific endurance and propulsion distances", () => {
    expect(newExpedition(0, 1, "guardian").hull).toBeGreaterThan(
      newExpedition(0, 1, "scout").hull,
    );
    expect(newExpedition(0, 1, "engineer").energy).toBeGreaterThan(
      newExpedition(0, 1, "scout").energy,
    );
    let found = false;
    for (let seed = 1; seed < 70; seed++) {
      const run = newExpedition(0, seed, "engineer");
      if (!actionAvailable(run, { kind: "dash", direction: "right" })) continue;
      const after = transition(run, { kind: "dash", direction: "right" });
      expect(after.turn).toBe(1);
      expect(after.energy).toBeLessThanOrEqual(run.energy - 2);
      expect(distance(after.position, run.position)).toBe(2);
      found = true;
      break;
    }
    expect(found).toBe(true);
  });

  it("repels nearby drones, but cannot trigger an empty impulse", () => {
    const run = newExpedition(7, 13, "engineer");
    const enemy = { position: START + 1, home: START + 27, stunned: 0 };
    const ready = { ...run, drones: [enemy] };
    const after = transition(ready, { kind: "pulse" });
    expect(after.drones[0]!.position).toBe(enemy.home);
    expect(after.drones[0]!.stunned).toBeGreaterThan(0);
    expect(after.energy).toBe(run.energy - 2);
    expect(transition({ ...ready, drones: [] }, { kind: "pulse" })).toEqual({
      ...ready,
      drones: [],
    });
  });

  it("damages the hull on high tide and permits tactical waiting", () => {
    const base = newExpedition(2, 71, "guardian");
    const water = base.terrain.indexOf("tide");
    expect(water).toBeGreaterThan(0);
    const game = {
      ...base,
      position: water,
      turn: 2,
      revealed: [...base.revealed],
    };
    const after = transition(game, { kind: "wait" });
    expect(tideIsHigh(after.turn)).toBe(true);
    expect(after.hull).toBe(base.hull - 1);
    expect(tideIsHigh(0)).toBe(false);
    expect(tideIsHigh(5)).toBe(true);
    expect(tideIsHigh(6)).toBe(false);
  });

  it("ends the game on hull depletion without losing the original state", () => {
    const base = newExpedition(1, 7, "scout");
    const water = base.terrain.indexOf("tide");
    const previous = { ...base, turn: 2, hull: 1, position: water };
    const after = transition(previous, { kind: "wait" });
    expect(after.phase).toBe("lost");
    expect(after.hull).toBe(0);
    expect(previous.phase).toBe("playing");
  });

  it("advances sentinels deterministically and applies an attack only in range", () => {
    const base = newExpedition(3, 17, "guardian");
    const terrain = [...base.terrain];
    terrain[START + 1] = "floor";
    terrain[START + 2] = "floor";
    const run = {
      ...base,
      terrain,
      turn: 1,
      drones: [{ position: START + 2, home: START + 2, stunned: 0 }],
    };
    const approached = transition(run, { kind: "wait" });
    expect(approached.drones[0]!.position).toBe(START + 1);
    expect(approached.hull).toBe(run.hull);
    const quiet = transition(approached, { kind: "wait" });
    expect(quiet.hull).toBe(run.hull);
    const attacked = transition(quiet, { kind: "wait" });
    expect(attacked.hull).toBe(run.hull - 1);
  });

  it("rejects malformed restores", () => {
    const valid = newExpedition(0, 17, "guardian");
    expect(validateExpedition(valid)).toBe(true);
    expect(validateExpedition({ ...valid, terrain: [] })).toBe(false);
    expect(validateExpedition({ ...valid, position: 100 })).toBe(false);
    expect(validateExpedition({ ...valid, log: 10 })).toBe(false);
  });
});

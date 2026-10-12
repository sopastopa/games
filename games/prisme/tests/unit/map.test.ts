import { describe, expect, it } from "vitest";
import {
  cell,
  generateArena,
  hasSight,
  MAX_ZONE,
  nextStep,
  reachable,
  SIZE,
  START,
  visibleCells,
} from "../../src/domain/map";

describe("seeded district generation", () => {
  it("replays precisely the same world, gates, enemies and loot", () => {
    expect(generateArena(42871, 2)).toEqual(generateArena(42871, 2));
    expect(generateArena(42871, 2)).not.toEqual(generateArena(42872, 2));
    expect(generateArena(42871, 2)).not.toEqual(generateArena(42871, 3));
  });

  it("rejects invalid seeds and stages", () => {
    for (const seed of [0, -4, 1.1, NaN, Infinity, 1000000000]) {
      expect(() => generateArena(seed, 1)).toThrow();
    }
    expect(() => generateArena(17, 0)).toThrow();
    expect(() => generateArena(17, MAX_ZONE + 1)).toThrow();
  });

  it("gates guarantee a valid ordered expedition for 480 worlds", () => {
    for (let zone = 1; zone <= MAX_ZONE; zone++) {
      for (let seed = 1; seed <= 120; seed++) {
        const arena = generateArena(seed * 7919, zone);
        expect(arena.walls).toHaveLength(SIZE * SIZE);
        expect(arena.relays).toHaveLength(3);
        expect(arena.spawns).toHaveLength(5 + zone * 3);
        expect(arena.doors).toHaveLength(8);
        const startReach = reachable(arena, START);
        const roseKey = arena.pickups.find((item) => item.kind === "key-rose")!;
        const cyanKey = arena.pickups.find((item) => item.kind === "key-cyan")!;
        for (const key of [roseKey, cyanKey]) {
          expect(startReach.has(cell(key))).toBe(true);
        }
        expect(startReach.has(cell(arena.relays[0]!))).toBe(false);
        expect(startReach.has(cell(arena.relays[1]!))).toBe(false);
        const withKeys = reachable(arena, START, ["rose", "cyan"]);
        expect(withKeys.has(cell(arena.relays[0]!))).toBe(true);
        expect(withKeys.has(cell(arena.relays[1]!))).toBe(true);
        expect(withKeys.has(cell(arena.relays[2]!))).toBe(false);
        const allAccess = reachable(arena, START, ["rose", "cyan", "core"]);
        for (const point of [
          ...arena.relays,
          arena.exit,
          ...arena.pickups,
          ...arena.spawns,
        ]) {
          expect(allAccess.has(cell(point))).toBe(true);
          expect(
            nextStep(arena, START, point, ["rose", "cyan", "core"]),
          ).not.toBeNull();
        }
        for (let x = 0; x < SIZE; x++) {
          expect(arena.walls[x]).toBe(true);
          expect(arena.walls[(SIZE - 1) * SIZE + x]).toBe(true);
        }
      }
    }
  });

  it("closed gates block movement and vision, while open doors restore it", () => {
    const arena = generateArena(1234, 1);
    const before = { x: 19, y: 5 };
    const after = { x: 21, y: 5 };
    expect(hasSight(arena, before, after)).toBe(false);
    expect(hasSight(arena, before, after, ["rose"])).toBe(true);
    expect(nextStep(arena, before, after)).toBeNull();
    expect(nextStep(arena, before, after, ["rose"])).not.toBeNull();
    expect(nextStep(arena, START, START)).toBeNull();
  });

  it("reveals the face of an adjacent opaque wall, but not the floor behind it", () => {
    const arena = generateArena(771, 1);
    const walls = [...arena.walls];
    const obstacle = { x: START.x + 1, y: START.y };
    const behind = { x: START.x + 2, y: START.y };
    walls[cell(obstacle)] = true;
    const blocked = { ...arena, walls };
    const vision = visibleCells(blocked, START);

    expect(hasSight(blocked, START, obstacle)).toBe(true);
    expect(vision[cell(obstacle)]).toBe(true);
    expect(hasSight(blocked, START, behind)).toBe(false);
    expect(vision[cell(behind)]).toBe(false);
  });

  it("vision reveals terrain near the player without revealing behind a wall", () => {
    const arena = generateArena(44, 1);
    const vision = visibleCells(arena, START);
    expect(vision[cell(START)]).toBe(true);
    expect(vision[cell({ x: 35, y: 35 })]).toBe(false);
    expect(vision[cell({ x: 21, y: 5 })]).toBe(false);
  });
});

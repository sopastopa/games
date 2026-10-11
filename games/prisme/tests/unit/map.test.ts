import { describe, expect, it } from "vitest";
import {
  cell,
  generateArena,
  hasSight,
  MAX_ZONE,
  nextStep,
  reachable,
  SIZE,
} from "../../src/domain/map";

describe("seeded procedural arenas", () => {
  it("reproduces exactly the same map with the same seed and zone", () => {
    expect(generateArena(42871, 2)).toEqual(generateArena(42871, 2));
    expect(generateArena(42871, 2)).not.toEqual(generateArena(42872, 2));
    expect(generateArena(42871, 2)).not.toEqual(generateArena(42871, 3));
  });

  it("rejects invalid seeds and zones", () => {
    for (const seed of [0, -4, 1.1, NaN, Infinity, 1000000000]) {
      expect(() => generateArena(seed, 1)).toThrow();
    }
    expect(() => generateArena(17, 0)).toThrow();
    expect(() => generateArena(17, MAX_ZONE + 1)).toThrow();
  });

  it("keeps every objective and spawn accessible across many seeds", () => {
    for (let zone = 1; zone <= MAX_ZONE; zone++) {
      for (let seed = 1; seed <= 160; seed++) {
        const arena = generateArena(seed * 7919, zone);
        expect(arena.walls).toHaveLength(SIZE * SIZE);
        expect(arena.relays).toHaveLength(3);
        expect(arena.spawns).toHaveLength(2 + zone * 2);
        const reachableCells = reachable(arena, { x: 6, y: 6 });
        for (const point of [...arena.relays, arena.exit, ...arena.spawns]) {
          expect(reachableCells.has(cell(point))).toBe(true);
          expect(
            nextStep(arena, { x: 6, y: 6 }, point),
          ).not.toBeNull();
        }
        for (let x = 0; x < SIZE; x++) {
          expect(arena.walls[x]).toBe(true);
          expect(arena.walls[(SIZE - 1) * SIZE + x]).toBe(true);
        }
      }
    }
  });

  it("walls block enemy sight, without hiding points in the same open cell", () => {
    const arena = generateArena(1234, 1);
    expect(hasSight(arena, { x: 6, y: 6 }, { x: 6.1, y: 6 })).toBe(true);
    expect(
      nextStep(arena, { x: 6, y: 6 }, { x: 6, y: 6 }),
    ).toBeNull();
  });
});

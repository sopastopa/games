import { describe, expect, it } from "vitest";
import { distance, generateMap, neighbors, randomSequence, shortestPath } from "../../src/domain/generation";
import { EXIT, SIZE, START } from "../../src/domain/types";

describe("seeded expedition map generation", () => {
  it("is deterministic for every map, including enemy positions", () => {
    expect(generateMap(8, 123456)).toEqual(generateMap(8, 123456));
    expect(generateMap(8, 123456)).not.toEqual(generateMap(8, 123457));
    expect(randomSequence(42)()).toBe(randomSequence(42)());
  });

  it("keeps the exit and every objective reachable in 300 seeded maps", () => {
    for (const sector of [0, 1, 3, 5, 8, 11]) {
      for (let seed = 1; seed <= 50; seed++) {
        const { terrain, drones } = generateMap(sector, seed);
        expect(terrain).toHaveLength(SIZE * SIZE);
        expect(terrain[START]).toBe("floor");
        expect(terrain[EXIT]).toBe("exit");
        const objectives = terrain.flatMap((cell, index) => ["core", "archive", "beacon", "battery", "exit"].includes(cell) ? [index] : []);
        expect(terrain.filter((cell) => cell === "core")).toHaveLength(2 + Math.floor(sector / 4));
        expect(terrain.filter((cell) => cell === "archive")).toHaveLength(3);
        for (const target of objectives) {
          expect(shortestPath(terrain, START, target).length).toBeGreaterThan(0);
        }
        for (const drone of drones) {
          expect(terrain[drone.position]).toBe("floor");
          expect(distance(drone.position, START)).toBeGreaterThanOrEqual(5);
        }
      }
    }
  });

  it("does not wrap navigation across board edges", () => {
    expect(neighbors(0)).toEqual([1, SIZE]);
    expect(neighbors(SIZE - 1)).not.toContain(SIZE);
    expect(distance(0, SIZE - 1)).toBe(SIZE - 1);
    expect(shortestPath(Array(SIZE * SIZE).fill("wall"), START, EXIT)).toEqual([]);
  });
});

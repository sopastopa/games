import { describe, expect, it } from "vitest";
import {
  advance,
  distance,
  launch,
  MAX_FLIGHT,
  STEP,
  WORLD,
} from "../../src/domain/physics";
import { levels } from "../../src/domain/levels";

const indexFor = (level: (typeof levels)[number]): number => levels.indexOf(level);

describe("18 REBOND levels — ricochets obligatoires", () => {
  it("has unique IDs, clear endpoints, varied trajectories and obstacles", () => {
    expect(levels).toHaveLength(18);
    expect(new Set(levels.map((level) => level.id)).size).toBe(18);
    expect(
      levels.filter((level) => level.bumpers.length > 0).length,
    ).toBeGreaterThan(10);
    expect(
      levels.filter((level) => level.bumpers.length > 1).length,
    ).toBeGreaterThan(2);
    for (const level of levels) {
      expect(level.title.length).toBeGreaterThan(2);
      expect(level.goal.x).toBeGreaterThan(30);
      expect(level.goal.x).toBeLessThan(WORLD.width - 30);
      expect(level.goal.y).toBeGreaterThan(30);
      expect(level.goal.y).toBeLessThan(WORLD.floor);
      expect(distance(level.source, level.goal)).toBeGreaterThan(65);
      expect(level.goalRadius).toBeGreaterThanOrEqual(22);
      expect(level.required.length).toBe(indexFor(level) < 5 ? 1 : indexFor(level) < 11 ? 2 : indexFor(level) < 16 ? 3 : 4);
      expect(level.required.every(id => level.bumpers.some(b => b.id === id))).toBe(true);
      expect(level.reference.time).toBeLessThan(MAX_FLIGHT);
    }
  });

  it.each(levels.map((level) => [level.id, level] as const))(
    "%s has a deterministic shot that reaches its target",
    (_id, level) => {
      let ball = launch(
        level.source,
        level.reference.angle,
        level.reference.speed,
      );
      let reached = false;
      const activated: string[] = [];
      let passedBeforeUnlock = false;
      for (let frame = 0; frame < Math.ceil(MAX_FLIGHT / STEP); frame++) {
        const result = advance(ball, level);
        ball = result.ball;
        for (const id of result.contacts) {
          if (id === level.required[activated.length]) activated.push(id);
        }
        if (result.hitGoal && activated.length !== level.required.length) passedBeforeUnlock = true;
        if (result.hitGoal && activated.length === level.required.length) {
          reached = true;
          break;
        }
      }
      expect(reached, level.id).toBe(true);
      expect(activated, level.id).toEqual(level.required);
      expect(passedBeforeUnlock, level.id).toBe(false);
    },
  );
});

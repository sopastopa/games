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

describe("18 REBOND levels", () => {
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
      for (let frame = 0; frame < Math.ceil(MAX_FLIGHT / STEP); frame++) {
        const result = advance(ball, level);
        ball = result.ball;
        if (result.hitGoal) {
          reached = true;
          break;
        }
      }
      expect(reached, level.id).toBe(true);
    },
  );
});

import { describe, expect, it } from "vitest";
import {
  advance,
  BALL_RADIUS,
  distance,
  estimateTrajectory,
  GRAVITY,
  launch,
  MAX_FLIGHT,
  project,
  STEP,
  step,
  WORLD,
} from "../../src/domain/physics";
import type { Bumper } from "../../src/domain/types";

describe("REBOND — deterministic physics", () => {
  it("launches at the required angle and speed", () => {
    const source = { x: 120, y: 380 };
    const ball = launch(source, 60, 600);
    expect(ball.x).toBe(120);
    expect(ball.y).toBe(380);
    expect(ball.vx).toBeCloseTo(300);
    expect(ball.vy).toBeCloseTo(-600 * Math.sin(Math.PI / 3));
    expect(ball.elapsed).toBe(0);
    expect(GRAVITY).toBeGreaterThan(0);
    expect(STEP).toBeCloseTo(1 / 120);
  });

  it("updates falling velocity and remains deterministic", () => {
    const ball = launch({ x: 200, y: 260 }, 30, 510);
    expect(step(ball, [])).toEqual(step(ball, []));
    const moved = step(ball, []);
    expect(moved.y).toBeLessThan(ball.y);
    expect(moved.vy).toBeGreaterThan(ball.vy);
    expect(moved.elapsed).toBeCloseTo(STEP);
    expect(step(ball, [], Number.NaN)).toEqual(ball);
    expect(step(ball, [], -1)).toEqual(ball);
  });

  it("bounces from the right wall, the floor, and the ceiling", () => {
    const wall = step(
      {
        x: WORLD.width - WORLD.margin - BALL_RADIUS - 1,
        y: 310,
        vx: 1000,
        vy: 0,
        elapsed: 0,
      },
      [],
    );
    expect(wall.vx).toBeLessThan(0);
    expect(wall.x).toBeLessThanOrEqual(
      WORLD.width - WORLD.margin - BALL_RADIUS,
    );
    const floor = step(
      {
        x: 400,
        y: WORLD.floor - BALL_RADIUS - 1,
        vx: 100,
        vy: 800,
        elapsed: 0,
      },
      [],
    );
    expect(floor.vy).toBeLessThan(0);
    const ceiling = step(
      {
        x: 400,
        y: WORLD.margin + BALL_RADIUS + 1,
        vx: 0,
        vy: -950,
        elapsed: 0,
      },
      [],
    );
    expect(ceiling.vy).toBeGreaterThan(0);
  });

  it("reflects velocity on circular obstacles", () => {
    const bumper: Bumper = { id: "b1", x: 450, y: 300, radius: 28 };
    const collision = step(
      { x: 450 - 38, y: 300, vx: 900, vy: 0, elapsed: 0 },
      [bumper],
    );
    expect(collision.vx).toBeLessThan(0);
    expect(distance(collision, bumper)).toBeGreaterThanOrEqual(
      BALL_RADIUS + bumper.radius - 0.001,
    );
  });

  it("projects exactly the same path as the manual fixed-step simulation", () => {
    const source = { x: 145, y: 440 };
    const sample = project(source, 43, 620, [], 1);
    let repeated = launch(source, 43, 620);
    for (let i = 0; i < Math.round(1 / STEP); i++)
      repeated = step(repeated, []);
    expect(sample).toEqual(repeated);
    expect(
      estimateTrajectory(
        {
          id: "x",
          title: "",
          subtitle: "",
          chapter: "",
          source,
          goal: source,
          goalRadius: 22,
          bumpers: [],
          reference: { angle: 43, speed: 620, time: 1 },
        },
        43,
        620,
      ).length,
    ).toBeGreaterThan(10);
  });

  it("reports goal contact and expiration at the appropriate time", () => {
    const source = { x: 145, y: 440 };
    const level = {
      id: "x",
      title: "",
      subtitle: "",
      chapter: "",
      source,
      goal: { x: 145, y: 440 },
      goalRadius: 30,
      bumpers: [],
      reference: { angle: 40, speed: 600, time: 1 },
    };
    expect(advance(launch(source, 40, 600), level).hitGoal).toBe(true);
    const old = { ...launch(source, 40, 600), elapsed: MAX_FLIGHT - STEP / 2 };
    expect(advance(old, level).expired).toBe(true);
  });
});

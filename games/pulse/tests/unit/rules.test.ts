import { describe, expect, it } from "vitest";
import {
  advance,
  angularDistance,
  createGame,
  difficulty,
  normalize,
  pause,
  start,
  tap,
  TAU,
} from "../../src/domain/rules";

const centered = () => {
  let state = start(createGame());
  for (let index = 0; index < 24; index++) state = advance(state, 0.05);
  return state;
};

describe("PULSE — timing domain", () => {
  it("initializes an accessible and reproducible first attempt", () => {
    const a = createGame();
    expect(a).toEqual(createGame());
    expect(a.phase).toBe("ready");
    expect(a.score).toBe(0);
    expect(a.hits).toBe(0);
    expect(a.halfWindow).toBeGreaterThan(0.4);
    expect(a.speed).toBe(1.5);
  });

  it("handles angle wrap-around and numeric edge cases", () => {
    expect(normalize(-Math.PI)).toBeCloseTo(Math.PI);
    expect(normalize(TAU + 0.4)).toBeCloseTo(0.4);
    expect(normalize(Number.POSITIVE_INFINITY)).toBe(0);
    expect(angularDistance(0.03, TAU - 0.03)).toBeCloseTo(0.06);
    expect(angularDistance(0, Math.PI)).toBeCloseTo(Math.PI);
  });

  it("starts, pauses, resumes and rejects invalid transitions", () => {
    const initial = createGame();
    expect(pause(initial)).toEqual(initial);
    expect(advance(initial, 1)).toEqual(initial);
    const running = start(initial);
    expect(running.phase).toBe("running");
    expect(start(running)).toEqual(running);
    const paused = pause(running);
    expect(paused.phase).toBe("paused");
    expect(advance(paused, 0.03)).toEqual(paused);
    expect(pause(paused).phase).toBe("running");
  });

  it("clamps elapsed frame time so backgrounding cannot skip an arc", () => {
    const running = start(createGame());
    expect(advance(running, 4).angle).toBeCloseTo(
      normalize(running.angle + running.speed * 0.05),
    );
    expect(advance(running, -20).angle).toBeCloseTo(running.angle);
    expect(advance(running, Number.NaN).angle).toBeCloseTo(running.angle);
  });

  it("loses immediately on an early or late tap", () => {
    const state = start(createGame());
    const lost = tap(state, () => 0.5);
    expect(lost.phase).toBe("lost");
    expect(lost.lastResult).toBe("miss");
    expect(lost.score).toBe(0);
    expect(tap(lost, () => 0)).toEqual(lost);
  });

  it("awards two points on a perfect central tap and reverses direction", () => {
    const state = centered();
    expect(angularDistance(state.angle, state.target)).toBeLessThan(
      state.halfWindow * 0.28,
    );
    const next = tap(state, () => 0);
    expect(next.phase).toBe("running");
    expect(next.lastResult).toBe("perfect");
    expect(next.score).toBe(2);
    expect(next.perfects).toBe(1);
    expect(next.hits).toBe(1);
    expect(next.direction).toBe(-1);
    expect(angularDistance(next.angle, next.target)).toBeCloseTo(1.15);
    expect(next.speed).toBeGreaterThan(state.speed);
    expect(next.halfWindow).toBeLessThan(state.halfWindow);
  });

  it("awards one point when inside the outer target region", () => {
    let state = start(createGame());
    for (let index = 0; index < 21; index++) state = advance(state, 0.05);
    const next = tap(state, () => 1);
    expect(next.lastResult).toBe("good");
    expect(next.score).toBe(1);
    expect(next.perfects).toBe(0);
    expect(next.hits).toBe(1);
    expect(angularDistance(next.angle, next.target)).toBeGreaterThan(2.4);
  });

  it("caps difficulty to maintain human-scale reaction windows", () => {
    expect(difficulty(0)).toEqual({ speed: 1.5, halfWindow: 0.47 });
    expect(difficulty(10).speed).toBeGreaterThan(difficulty(1).speed);
    expect(difficulty(999)).toEqual({ speed: 2.75, halfWindow: 0.19 });
    expect(difficulty(-100)).toEqual(difficulty(0));
  });

  it("clamps random input without making target placement unfair", () => {
    const state = centered();
    for (const value of [-100, 0, 0.5, 1, 100, Number.NaN]) {
      const next = tap(state, () => value);
      const distance = angularDistance(next.angle, next.target);
      expect(distance).toBeGreaterThanOrEqual(1.15 - 1e-8);
      expect(distance).toBeLessThanOrEqual(2.45);
    }
  });
});

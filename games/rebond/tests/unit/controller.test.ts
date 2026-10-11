import { describe, expect, it, vi } from "vitest";
import { RebondController } from "../../src/application/RebondController";
import type {
  Clock,
  Ports,
  Progress,
  ProgressStore,
} from "../../src/application/ports";
import { levels } from "../../src/domain/levels";

function harness(saved: Progress | null = null) {
  let update: (delta: number) => void = () => {};
  const cancel = vi.fn();
  const write = vi.fn();
  const clock: Clock = {
    begin(callback) {
      update = callback;
      return cancel;
    },
  };
  const store: ProgressStore = { read: () => saved, write };
  const ports: Ports = { clock, store };
  return {
    game: new RebondController(ports),
    tick(delta = 1 / 60) {
      update(delta);
    },
    cancel,
    write,
  };
}

describe("REBOND application controller", () => {
  it("protects level progression and clamps the aim", () => {
    const { game } = harness();
    expect(game.snapshot.phase).toBe("ready");
    expect(game.snapshot.index).toBe(0);
    expect(game.selectLevel(1)).toBe(false);
    expect(game.selectLevel(-1)).toBe(false);
    expect(game.selectLevel(0.5)).toBe(false);
    expect(game.aim(Number.NaN, 500)).toBe(false);
    expect(game.aim(400, 900)).toBe(true);
    expect(game.snapshot.angle).toBe(82);
    expect(game.snapshot.speed).toBe(810);
    expect(game.adjust(-200, -900)).toBe(true);
    expect(game.snapshot.angle).toBe(8);
    expect(game.snapshot.speed).toBe(420);
  });

  it("shoots, cancels the clock on restart and tracks attempts", () => {
    const { game, tick, cancel } = harness();
    const observer = vi.fn();
    const unsubscribe = game.subscribe(observer);
    expect(observer).toHaveBeenCalledTimes(1);
    expect(game.shoot()).toBe(true);
    expect(game.shoot()).toBe(false);
    expect(game.snapshot.attempts).toBe(1);
    expect(game.aim(40, 600)).toBe(false);
    tick(0.05);
    expect(game.snapshot.ball.elapsed).toBeGreaterThan(0);
    game.retry();
    expect(game.snapshot.phase).toBe("ready");
    expect(game.snapshot.attempts).toBe(1);
    expect(cancel).toHaveBeenCalled();
    game.restart();
    expect(game.snapshot.attempts).toBe(0);
    unsubscribe();
    const previous = observer.mock.calls.length;
    game.destroy();
    expect(observer.mock.calls.length).toBe(previous);
  });

  it("unlocks the next level when the authored reference shot hits the goal", () => {
    const { game, tick, write } = harness();
    const { angle, speed } = levels[0]!.reference;
    expect(game.aim(angle, speed)).toBe(true);
    expect(game.shoot()).toBe(true);
    for (let i = 0; i < 250 && game.snapshot.phase === "flying"; i++)
      tick(1 / 60);
    expect(game.snapshot.phase).toBe("solved");
    expect(game.snapshot.starCount).toBe(3);
    expect(game.snapshot.best[levels[0]!.id]).toBe(1);
    expect(game.snapshot.unlocked).toBe(1);
    expect(write).toHaveBeenCalled();
    expect(game.next()).toBe(true);
    expect(game.snapshot.index).toBe(1);
    expect(game.snapshot.attempts).toBe(0);
  });

  it("restores saved progress and handles page suspend gracefully", () => {
    const { game } = harness({
      unlocked: 5,
      current: 3,
      best: { "rebond-01": 2 },
    });
    expect(game.snapshot.index).toBe(3);
    expect(game.snapshot.starCount).toBe(0);
    expect(game.selectLevel(0)).toBe(true);
    expect(game.snapshot.starCount).toBe(2);
    game.shoot();
    game.suspend();
    expect(game.snapshot.phase).toBe("ready");
  });

  it("requires at least one level", () => {
    const store: ProgressStore = { read: () => null, write: () => {} };
    const clock: Clock = { begin: () => () => {} };
    expect(() => new RebondController({ store, clock }, [])).toThrow();
  });
});

import { describe, expect, it, vi } from "vitest";
import { PulseController } from "../../src/application/PulseController";
import type { Clock, Ports } from "../../src/application/ports";

function fixture(best = 0): {
  game: PulseController;
  frame: (delta: number) => void;
  cancel: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  good: ReturnType<typeof vi.fn>;
  miss: ReturnType<typeof vi.fn>;
} {
  let frame: (delta: number) => void = () => {};
  const cancel = vi.fn();
  const write = vi.fn();
  const good = vi.fn();
  const miss = vi.fn();
  const clock: Clock = {
    begin(callback) {
      frame = callback;
      return cancel;
    },
  };
  const ports: Ports = {
    random: () => 0,
    clock,
    store: { read: () => best, write },
    effects: { hit: good, miss },
  };
  return {
    game: new PulseController(ports),
    frame: (delta) => frame(delta),
    cancel,
    write,
    good,
    miss,
  };
}

describe("PULSE — application", () => {
  it("orchestrates clock, score, audio, and persistence", () => {
    const { game, frame, cancel, write, good, miss } = fixture();
    const listener = vi.fn();
    const unsubscribe = game.subscribe(listener);
    expect(listener).toHaveBeenCalledOnce();
    game.action();
    expect(game.snapshot.phase).toBe("running");
    for (let i = 0; i < 24; i++) frame(0.05);
    game.action();
    expect(game.snapshot.score).toBe(2);
    expect(game.snapshot.bestScore).toBe(2);
    expect(good).toHaveBeenCalledWith(true);
    expect(write).toHaveBeenCalledWith(2);
    game.action();
    expect(game.snapshot.phase).toBe("lost");
    expect(miss).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
    game.action();
    expect(game.snapshot.phase).toBe("running");
    expect(game.snapshot.score).toBe(0);
    game.suspend();
    expect(game.snapshot.phase).toBe("paused");
    game.action();
    expect(game.snapshot.phase).toBe("running");
    unsubscribe();
    game.destroy();
  });

  it("supports pause, restart and ignores stale callbacks", () => {
    const { game, cancel, frame } = fixture(12);
    expect(game.snapshot.bestScore).toBe(12);
    game.togglePause();
    expect(game.snapshot.phase).toBe("ready");
    game.action();
    game.togglePause();
    expect(game.snapshot.phase).toBe("paused");
    game.restart();
    expect(game.snapshot.phase).toBe("ready");
    expect(game.snapshot.score).toBe(0);
    expect(cancel).toHaveBeenCalled();
    frame(10);
    expect(game.snapshot.phase).toBe("ready");
  });

  it("ignores invalid previously saved records", () => {
    const { game } = fixture(-20);
    expect(game.snapshot.bestScore).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { NuageController, normalizeProgress } from "../../src/application/NuageController";
import type { Ports } from "../../src/application/ports";
import type { Progress } from "../../src/domain/types";

function harness(saved: Progress | null = null): {
  game: NuageController;
  advance: (seconds?: number) => void;
  writes: Progress[];
  active: () => boolean;
} {
  const writes: Progress[] = [];
  let tick: ((seconds: number) => void) | null = null;
  const ports: Ports = {
    store: {
      read: () => saved,
      write: (progress) => {
        writes.push(progress);
      },
    },
    clock: {
      start: (callback) => {
        tick = callback;
        return () => {
          tick = null;
        };
      },
    },
  };
  const game = new NuageController(ports);
  return {
    game,
    writes,
    advance: (seconds = 1 / 30) => {
      const frame = tick;
      if (frame) frame(seconds);
    },
    active: () => tick !== null,
  };
}

describe("NUAGE — application", () => {
  it("starts, jumps, pauses and resumes with an injectable clock", () => {
    const { game, advance, active } = harness();
    expect(game.state.run.phase).toBe("ready");
    expect(game.state.chapterIndex).toBe(0);
    expect(game.select(1)).toBe(false);
    expect(active()).toBe(false);
    game.action();
    expect(active()).toBe(true);
    game.action();
    expect(game.state.run.grounded).toBe(false);
    advance();
    const x = game.state.run.x;
    game.hide();
    expect(game.state.run.phase).toBe("paused");
    expect(active()).toBe(false);
    advance();
    expect(game.state.run.x).toBe(x);
    game.togglePause();
    expect(game.state.run.phase).toBe("running");
    game.dispose();
    expect(active()).toBe(false);
  });

  it("finishes a real full chapter and unlocks the next, preserving memories", () => {
    const { game, advance, writes } = harness();
    game.setPromenade(true);
    game.start();
    for (let i = 0; i < 250 && game.state.run.phase !== "complete"; i++)
      advance();
    expect(game.state.run.phase).toBe("complete");
    expect(game.state.progress.finished).toEqual(["rose"]);
    expect(game.state.progress.unlocked).toBe(1);
    expect(writes.at(-1)?.finished).toEqual(["rose"]);
    expect(game.next()).toBe(true);
    expect(game.state.chapterIndex).toBe(1);
    expect(game.state.run.phase).toBe("ready");
  });

  it("restart resets movement but keeps chapter and accessibility preference", () => {
    const { game, advance } = harness();
    game.setPromenade(true);
    game.start();
    advance();
    game.restart();
    expect(game.state.run.phase).toBe("ready");
    expect(game.state.run.x).toBe(80);
    expect(game.state.progress.promenade).toBe(true);
  });

  it("restores validated saves and rejects invalid selection", () => {
    const initial: Progress = {
      selected: 2,
      unlocked: 3,
      finished: ["rose", "orange", "invented"],
      collected: { rose: 99, orange: 2 },
      promenade: true,
    };
    const { game } = harness(initial);
    expect(game.state.chapterIndex).toBe(2);
    expect(game.state.finishedCount).toBe(2);
    expect(game.state.progress.collected.rose).toBe(3);
    expect(game.select(-1)).toBe(false);
    expect(game.select(4)).toBe(false);
    expect(game.select(Number.NaN)).toBe(false);
    expect(game.select(1)).toBe(true);
    expect(game.state.chapterIndex).toBe(1);
  });

  it("notifies listeners and removes them on unsubscribe", () => {
    const { game, advance } = harness();
    const seen: number[] = [];
    const stop = game.subscribe((view) => {
      seen.push(view.run.x);
    });
    game.start();
    advance();
    stop();
    const count = seen.length;
    advance();
    expect(seen.length).toBe(count);
  });

  it("ignores storage failures and clamps corrupt progress", () => {
    const result = normalizeProgress({
      unlocked: 999,
      selected: -30,
      finished: ["rose", "rose", "not-real"],
      collected: { rose: -1, orange: 999 },
      promenade: false,
    });
    expect(result.unlocked).toBe(6);
    expect(result.selected).toBe(0);
    expect(result.finished).toEqual(["rose"]);
    expect(result.collected.rose).toBeUndefined();
    expect(result.collected.orange).toBe(3);
    const ports: Ports = {
      store: {
        read: () => {
          throw new Error("Blocked");
        },
        write: () => {
          throw new Error("Blocked");
        },
      },
      clock: { start: () => () => undefined },
    };
    const game = new NuageController(ports);
    expect(game.state.chapterIndex).toBe(0);
    expect(() => game.setPromenade(true)).not.toThrow();
  });
});

import { describe, expect, it, vi } from "vitest";
import { LisiereController } from "../../src/application/LisiereController";
import type { Ports, Progress } from "../../src/application/ports";
import { HOMES, stages, TOTAL_CELLS } from "../../src/domain/stages";
import type { Stage } from "../../src/domain/types";

function fixture(
  saved: Progress | null = null,
  customStages: readonly Stage[] = stages,
) {
  const write = vi.fn();
  const jobs: { callback: () => void; cancelled: boolean; done: boolean }[] =
    [];
  const cancel = vi.fn();
  const ports: Ports = {
    store: { read: () => saved, write },
    scheduler: {
      schedule(callback) {
        const job = { callback, cancelled: false, done: false };
        jobs.push(job);
        return () => {
          job.cancelled = true;
          cancel();
        };
      },
    },
  };
  return {
    game: new LisiereController(ports, customStages),
    write,
    cancel,
    flush() {
      const job = jobs.find((entry) => !entry.cancelled && !entry.done);
      if (!job) return false;
      job.done = true;
      job.callback();
      return true;
    },
  };
}

describe("LISIÈRE controller", () => {
  it("starts at first stage and schedules AI only after a human move", () => {
    const { game, flush } = fixture();
    const observer = vi.fn();
    const unsubscribe = game.subscribe(observer);
    expect(observer).toHaveBeenCalledOnce();
    expect(game.snapshot.available).toEqual([6, 13, 18]);
    expect(game.move(HOMES.ai)).toBe(false);
    expect(game.move(13)).toBe(true);
    expect(game.snapshot.thinking).toBe(true);
    expect(game.snapshot.available).toEqual([]);
    expect(game.move(18)).toBe(false);
    expect(flush()).toBe(true);
    expect(game.snapshot.match.moveCount).toBe(2);
    expect(game.snapshot.thinking).toBe(false);
    expect(game.snapshot.match.turn).toBe("player");
    unsubscribe();
    game.destroy();
  });

  it("undoes both the human move and its AI response", () => {
    const { game, flush } = fixture();
    expect(game.undo()).toBe(false);
    game.move(13);
    flush();
    expect(game.snapshot.match.moveCount).toBe(2);
    expect(game.undo()).toBe(true);
    expect(game.snapshot.match.moveCount).toBe(0);
    expect(game.snapshot.match.owners[13]).toBeNull();
    expect(game.snapshot.available).toContain(13);
  });

  it("cancels AI when the player undoes, restarts or switches region", () => {
    const { game, flush, cancel } = fixture({
      unlocked: 3,
      selected: 1,
      wins: ["lisiere-01"],
    });
    expect(game.snapshot.index).toBe(1);
    expect(game.snapshot.wins).toEqual(["lisiere-01"]);
    expect(game.move(6)).toBe(true);
    expect(game.undo()).toBe(true);
    expect(cancel).toHaveBeenCalled();
    expect(flush()).toBe(false);
    expect(game.move(6)).toBe(true);
    game.suspend();
    expect(game.snapshot.thinking).toBe(false);
    game.resume();
    expect(game.snapshot.thinking).toBe(true);
    expect(flush()).toBe(true);
    expect(game.select(0)).toBe(true);
    expect(game.snapshot.match.moveCount).toBe(0);
    expect(game.snapshot.index).toBe(0);
    game.restart();
    expect(game.snapshot.match.moveCount).toBe(0);
    expect(game.select(20)).toBe(false);
    expect(game.select(-1)).toBe(false);
    expect(game.select(0.5)).toBe(false);
  });

  it("unlocks the next region after a real victory and persists progress", () => {
    const allRocks = Array.from(
      { length: TOTAL_CELLS },
      (_, index) => index,
    ).filter((index) => ![HOMES.player, HOMES.ai, 13].includes(index));
    const shortStage: Stage = {
      id: "tiny-1",
      title: "Test",
      subtitle: "",
      chapter: "Test",
      depth: 1,
      rocks: allRocks,
      sanctuaries: [],
    };
    const second: Stage = { ...shortStage, id: "tiny-2" };
    const { game, write } = fixture(null, [shortStage, second]);
    expect(game.snapshot.canContinue).toBe(false);
    expect(game.next()).toBe(false);
    expect(game.move(13)).toBe(true);
    expect(game.snapshot.match.phase).toBe("won");
    expect(game.snapshot.scores.player).toBe(2);
    expect(game.snapshot.unlocked).toBe(1);
    expect(write).toHaveBeenCalled();
    expect(game.snapshot.wins).toEqual(["tiny-1"]);
    expect(game.next()).toBe(true);
    expect(game.snapshot.index).toBe(1);
    expect(game.snapshot.match.phase).toBe("playing");
  });

  it("rejects corrupted progress and missing stages", () => {
    const { game } = fixture({
      unlocked: 999,
      selected: 999,
      wins: ["fake", "lisiere-01"],
    });
    expect(game.snapshot.unlocked).toBe(9);
    expect(game.snapshot.index).toBe(9);
    expect(game.snapshot.wins).toEqual(["lisiere-01"]);
    expect(() => fixture(null, [])).toThrow();
  });
});

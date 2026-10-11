import { describe, expect, it, vi } from "vitest";
import { AbsentsController } from "../../src/application/AbsentsController";
import { findSolution } from "../../src/domain/solver";
import { levels } from "../../src/domain/levels";
import type { Progress, ProgressStore } from "../../src/application/ports";

function fixture(progress: Progress | null = null): {
  game: AbsentsController;
  save: ReturnType<typeof vi.fn>;
} {
  const save = vi.fn();
  const store: ProgressStore = { read: () => progress, write: save };
  return { game: new AbsentsController(levels, store), save };
}

describe("constellation controller", () => {
  it("starts locked, rejects protected nodes and enforces the removal budget", () => {
    const { game } = fixture();
    expect(game.snapshot.levelIndex).toBe(0);
    expect(game.selectLevel(1)).toBe(false);
    expect(game.toggle("source")).toBe(false);
    expect(game.toggle("target-a")).toBe(false);
    expect(game.toggle("danger")).toBe(false);
    expect(game.toggle("not-a-node")).toBe(false);
    const wrong = levels[0]!.nodes.find((node) => node.role === "neutral")!;
    expect(game.toggle(wrong.id)).toBe(true);
    expect(game.snapshot.movesLeft).toBe(0);
    expect(game.toggle("n7")).toBe(false);
    expect(game.toggle(wrong.id)).toBe(true);
    expect(game.snapshot.movesLeft).toBe(1);
    expect(game.selectLevel(-1)).toBe(false);
    expect(game.selectLevel(99)).toBe(false);
    expect(game.selectLevel(0.5)).toBe(false);
  });

  it("undoes and redoes moves, while clearing redo after a new decision", () => {
    const { game } = fixture();
    const [first, second] = levels[0]!.nodes.filter((node) => node.role === "neutral");
    expect(game.toggle(first!.id)).toBe(true);
    expect(game.snapshot.canUndo).toBe(true);
    expect(game.undo()).toBe(true);
    expect(game.snapshot.removed).toEqual([]);
    expect(game.snapshot.canRedo).toBe(true);
    expect(game.redo()).toBe(true);
    expect(game.snapshot.removed).toEqual([first!.id]);
    expect(game.undo()).toBe(true);
    expect(game.toggle(second!.id)).toBe(true);
    expect(game.redo()).toBe(false);
    game.reset();
    expect(game.snapshot.removed).toHaveLength(0);
    expect(game.snapshot.canUndo).toBe(false);
  });

  it("awards completion, unlocks the next level and persists it", () => {
    const { game, save } = fixture();
    const observer = vi.fn();
    const unsubscribe = game.subscribe(observer);
    expect(observer).toHaveBeenCalledOnce();
    const solution = findSolution(game.snapshot.level)!.removed;
    expect(game.hint()).toBe(solution[0]);
    for (const id of solution) expect(game.toggle(id)).toBe(true);
    expect(game.snapshot.analysis.solved).toBe(true);
    expect(game.snapshot.unlocked).toBe(1);
    expect(game.snapshot.completed).toContain("level-01");
    expect(save).toHaveBeenCalled();
    expect(game.toggle(solution[0]!)).toBe(false);
    expect(game.nextLevel()).toBe(true);
    expect(game.snapshot.levelIndex).toBe(1);
    expect(game.snapshot.removed).toEqual([]);
    expect(game.snapshot.canUndo).toBe(false);
    unsubscribe();
    const calls = observer.mock.calls.length;
    game.reset();
    expect(observer.mock.calls.length).toBe(calls);
  });

  it("loads unlocked progress and ignores completed IDs that do not exist", () => {
    const { game } = fixture({ unlocked: 999, current: 999, completed: ["level-01", "fake-level"] });
    expect(game.snapshot.unlocked).toBe(23);
    expect(game.snapshot.levelIndex).toBe(23);
    expect(game.snapshot.completed).toEqual(["level-01"]);
    expect(game.selectLevel(2)).toBe(true);
  });

  it("requires at least one level", () => {
    expect(() => new AbsentsController([], { read: () => null, write: () => {} })).toThrow();
  });
});

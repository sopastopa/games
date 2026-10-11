import { describe, expect, it } from "vitest";
import { TorsionController } from "../../src/application/TorsionController";
import type { Progress, ProgressStore } from "../../src/application/ports";

function fakeStore(initial: Progress | null = null): {
  store: ProgressStore;
  writes: Progress[];
} {
  const writes: Progress[] = [];
  return {
    writes,
    store: {
      read: () => initial,
      write: (progress) => {
        writes.push(progress);
      },
    },
  };
}

describe("TORSION — controller", () => {
  it("starts with the tutorial and locks later stages", () => {
    const { store } = fakeStore();
    const game = new TorsionController(store);
    expect(game.state.stageIndex).toBe(0);
    expect(game.state.unlocked).toBe(0);
    expect(game.select(1)).toBe(false);
    expect(game.select(-1)).toBe(false);
    expect(game.select(NaN)).toBe(false);
  });

  it("unlocks new workshops and persists best scores", () => {
    const { store, writes } = fakeStore();
    const game = new TorsionController(store);
    expect(game.turn(5)).toBe(true);
    expect(game.state.puzzle.phase).toBe("solved");
    expect(game.state.best).toBe(1);
    expect(game.state.completed).toBe(1);
    expect(game.state.unlocked).toBe(1);
    expect(writes.at(-1)?.bests.etincelle).toBe(1);
    expect(game.next()).toBe(true);
    expect(game.state.stageIndex).toBe(1);
    expect(game.state.puzzle.phase).toBe("playing");
    expect(game.turn(10)).toBe(true);
    expect(game.turn(6)).toBe(true);
    expect(game.state.puzzle.phase).toBe("solved");
    expect(game.state.best).toBe(2);
    expect(game.state.unlocked).toBe(2);
  });

  it("undoes one action and resets without deleting achievements", () => {
    const { store } = fakeStore();
    const game = new TorsionController(store);
    const initial = game.state.puzzle;
    expect(game.undo()).toBe(false);
    expect(game.turn(5)).toBe(true);
    expect(game.undo()).toBe(true);
    expect(game.state.puzzle).toEqual(initial);
    expect(game.state.completed).toBe(1);
    game.restart();
    expect(game.state.puzzle).toEqual(initial);
    expect(game.state.canUndo).toBe(false);
  });

  it("notifies subscribers and supports unsubscribe", () => {
    const { store } = fakeStore();
    const game = new TorsionController(store);
    const observed: number[] = [];
    const stop = game.subscribe((state) => {
      observed.push(state.puzzle.moves);
    });
    game.turn(5);
    stop();
    game.restart();
    expect(observed).toEqual([0, 1]);
  });

  it("validates corrupt progress and protects against storage exceptions", () => {
    const store: ProgressStore = {
      read: () => ({
        unlocked: 999,
        selected: -3,
        bests: { etincelle: -1, "autre-jeu": 4 },
      }),
      write: () => {
        throw new Error("Storage blocked");
      },
    };
    const game = new TorsionController(store);
    expect(game.state.unlocked).toBe(11);
    expect(game.state.stageIndex).toBe(0);
    expect(game.state.completed).toBe(0);
    expect(game.turn(5)).toBe(true);
    expect(game.state.puzzle.phase).toBe("solved");
  });

  it("resumes the saved unlocked workshop", () => {
    const { store } = fakeStore({
      unlocked: 2,
      selected: 1,
      bests: { etincelle: 3, "deux-temps": 7 },
    });
    const game = new TorsionController(store);
    expect(game.state.stageIndex).toBe(1);
    expect(game.state.best).toBe(7);
    expect(game.state.completed).toBe(2);
  });
});

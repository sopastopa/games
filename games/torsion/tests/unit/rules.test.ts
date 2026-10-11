import { describe, expect, it } from "vitest";
import { STAGES } from "../../src/domain/levels";
import {
  canTurn,
  initialPuzzle,
  playTurn,
  rotate,
  solved,
  square,
  validateStage,
} from "../../src/domain/rules";

describe("TORSION — domain", () => {
  it("rotates a 2x2 clockwise without mutating the source", () => {
    const stage = STAGES[0]!;
    const source = Array.from({ length: 16 }, (_, index) => index);
    const turned = rotate(source, stage, 0);
    expect([turned[0], turned[1], turned[4], turned[5]]).toEqual([
      4, 0, 5, 1,
    ]);
    expect(source[0]).toBe(0);
    expect(rotate(turned, stage, 0, true)).toEqual(source);
  });

  it("rejects squares across edges and invalid indices", () => {
    expect(square(4, 3)).toBeNull();
    expect(square(4, 12)).toBeNull();
    expect(square(4, -1)).toBeNull();
    expect(square(4, 2.5)).toBeNull();
    expect(square(4, 5)).toEqual([5, 6, 9, 10]);
  });

  it("does not rotate a block containing a rock", () => {
    const stage = STAGES[6]!;
    expect(canTurn(stage, 0)).toBe(false);
    const puzzle = initialPuzzle(stage);
    expect(rotate(puzzle.tiles, stage, 0)).toBe(puzzle.tiles);
    expect(playTurn(puzzle, stage, 0)).toBe(puzzle);
  });

  it("ignores no-op rotations and invalid actions", () => {
    const stage = STAGES[0]!;
    const puzzle = initialPuzzle(stage);
    expect(playTurn(puzzle, stage, -1)).toBe(puzzle);
    expect(playTurn(puzzle, stage, 15)).toBe(puzzle);
    const blank = Array<number>(16).fill(0);
    expect(rotate(blank, stage, 0)).toBe(blank);
  });

  it("solves the tutorial in exactly one clockwise turn", () => {
    const stage = STAGES[0]!;
    const start = initialPuzzle(stage);
    expect(start.phase).toBe("playing");
    const solvedPuzzle = playTurn(start, stage, 5);
    expect(solvedPuzzle.phase).toBe("solved");
    expect(solvedPuzzle.moves).toBe(1);
    expect(playTurn(solvedPuzzle, stage, 5)).toBe(solvedPuzzle);
  });

  it.each(STAGES)("stage $id has a legal deterministic solution", (stage) => {
    validateStage(stage);
    const puzzle = initialPuzzle(stage);
    expect(solved(puzzle.tiles, stage)).toBe(false);
    expect(initialPuzzle(stage)).toEqual(puzzle);
    expect(new Set(puzzle.tiles.filter((tile) => tile > 0)).size).toBe(
      stage.goals.length,
    );
    let current = puzzle;
    for (const anchor of [...stage.scramble].reverse()) {
      expect(canTurn(stage, anchor)).toBe(true);
      const next = playTurn(current, stage, anchor);
      expect(next).not.toBe(current);
      current = next;
    }
    expect(current.phase).toBe("solved");
    expect(current.moves).toBe(stage.scramble.length);
    stage.goals.forEach((cell, index) => {
      expect(current.tiles[cell]).toBe(index + 1);
    });
  });

  it("rejects invalid terrain and duplicate targets", () => {
    const first = STAGES[0]!;
    expect(() =>
      validateStage({ ...first, goals: [5, 5] }),
    ).toThrow("Invalid stage layout");
    expect(() =>
      validateStage({ ...first, rocks: [5] }),
    ).toThrow("Invalid stage layout");
    expect(() =>
      validateStage({ ...first, scramble: [3] }),
    ).toThrow("Invalid stage layout");
  });
});

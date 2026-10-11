import { describe, expect, it } from "vitest";
import {
  createMatch,
  legalMoves,
  neighbors,
  play,
  points,
  validateStage,
  winnerLabel,
} from "../../src/domain/rules";
import { HOMES, stages, TOTAL_CELLS } from "../../src/domain/stages";
import type { Match, Owner, Stage } from "../../src/domain/types";

const stage = stages[0]!;

function withOwners(
  positions: Readonly<Record<number, Owner>>,
  turn: "player" | "ai" = "player",
): Match {
  const owners: Owner[] = Array(TOTAL_CELLS).fill(null);
  owners[HOMES.player] = "player";
  owners[HOMES.ai] = "ai";
  for (const [index, owner] of Object.entries(positions))
    owners[Number(index)] = owner;
  return {
    owners,
    turn,
    phase: "playing",
    moveCount: 0,
    captured: [],
    lastMove: null,
  };
}

describe("LISIÈRE domain", () => {
  it("starts with two protected capitals and three neighboring moves", () => {
    const initial = createMatch(stage);
    expect(initial.owners[HOMES.player]).toBe("player");
    expect(initial.owners[HOMES.ai]).toBe("ai");
    expect(initial.moveCount).toBe(0);
    expect(initial.phase).toBe("playing");
    expect(legalMoves(initial, stage, "player")).toEqual([6, 13, 18]);
    expect(legalMoves(initial, stage, "ai")).toEqual([17, 22, 29]);
  });

  it("never connects cells across the board's left/right edges", () => {
    expect(neighbors(0)).toEqual([1, 6]);
    expect(neighbors(5)).toEqual([11, 4]);
    expect(neighbors(12)).toEqual([6, 13, 18]);
    expect(neighbors(-1)).toEqual([]);
    expect(neighbors(36)).toEqual([]);
    expect(neighbors(1.5)).toEqual([]);
  });

  it("rejects occupied, disconnected, mountain and invalid turns", () => {
    const first = createMatch(stage);
    expect(play(first, stage, HOMES.player)).toBeNull();
    expect(play(first, stage, HOMES.ai)).toBeNull();
    expect(play(first, stage, 35)).toBeNull();
    expect(play(first, stage, -1)).toBeNull();
    expect(play(first, stage, Number.NaN)).toBeNull();
    const next = play(first, stage, 13)!;
    expect(next).not.toBeNull();
    expect(next.owners[13]).toBe("player");
    expect(next.turn).toBe("ai");
    expect(next.moveCount).toBe(1);
    expect(first.owners[13]).toBeNull();
    expect(play(next, stage, 7)).toBeNull();
    expect(play({ ...first, phase: "won" }, stage, 13)).toBeNull();
  });

  it("captures enemies when they have two allied neighbors in one simultaneous wave", () => {
    const before = withOwners({ 7: "player", 13: "player", 14: "ai" });
    const after = play(before, stage, 8)!;
    expect(after.owners[8]).toBe("player");
    expect(after.owners[14]).toBe("player");
    expect(after.captured).toEqual([14]);
    expect(before.owners[14]).toBe("ai");
    expect(after.lastMove).toBe(8);
  });

  it("never converts an opponent capital, even when encircled", () => {
    const before = withOwners({ 16: "player", 17: "player", 22: "player" });
    const after = play(before, stage, 28)!;
    expect(after.owners[HOMES.ai]).toBe("ai");
    expect(after.captured).not.toContain(HOMES.ai);
  });

  it("awards sanctuary territory triple points", () => {
    const first = createMatch(stage);
    const hub = stage.sanctuaries[0]!;
    const owned = [...first.owners];
    owned[hub] = "player";
    expect(points({ ...first, owners: owned }, stage).player).toBe(4);
    expect(points(first, stage).player).toBe(1);
  });

  it("skips a blocked opponent and declares the winner when neither can move", () => {
    const owners: Owner[] = Array(TOTAL_CELLS).fill("player");
    owners[HOMES.ai] = "ai";
    owners[18] = null;
    owners[24] = null;
    const before: Match = {
      owners,
      phase: "playing",
      turn: "player",
      moveCount: 30,
      lastMove: null,
      captured: [],
    };
    const next = play(before, stage, 18)!;
    expect(next.turn).toBe("player");
    expect(next.phase).toBe("playing");
    const last = play(next, stage, 24)!;
    expect(last.phase).toBe("won");
    expect(legalMoves(last, stage, "player")).toEqual([]);
    expect(winnerLabel(last.phase)).toBe("Victoire");
    expect(winnerLabel("draw")).toBe("Égalité");
  });

  it("validates terrain and blocks mountains", () => {
    for (const design of stages) validateStage(design);
    const blocked: Stage = { ...stage, rocks: [13] };
    expect(legalMoves(createMatch(blocked), blocked, "player")).not.toContain(
      13,
    );
    expect(() => validateStage({ ...stage, rocks: [HOMES.player] })).toThrow();
    expect(() => validateStage({ ...stage, rocks: [99] })).toThrow();
    expect(() => validateStage({ ...stage, sanctuaries: [8, 8] })).toThrow();
    expect(() => validateStage({ ...stage, depth: 8 })).toThrow();
    expect(() =>
      validateStage({ ...stage, rocks: [13], sanctuaries: [13] }),
    ).toThrow();
  });
});

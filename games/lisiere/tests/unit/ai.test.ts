import { describe, expect, it } from "vitest";
import { chooseAiMove } from "../../src/domain/ai";
import {
  createMatch,
  legalMoves,
  play,
  validateStage,
} from "../../src/domain/rules";
import { stages, TOTAL_CELLS } from "../../src/domain/stages";

describe("LISIÈRE adversary and campaign", () => {
  it("provides ten distinct, symmetric and playable regions", () => {
    expect(stages).toHaveLength(10);
    expect(new Set(stages.map((stage) => stage.id)).size).toBe(10);
    const depths = stages.map((stage) => stage.depth);
    expect(depths).toEqual([...depths].sort((a, b) => a - b));
    for (const stage of stages) {
      validateStage(stage);
      for (const group of [stage.rocks, stage.sanctuaries]) {
        expect(group.length).toBeGreaterThanOrEqual(0);
        for (const cell of group)
          expect(group).toContain(TOTAL_CELLS - 1 - cell);
      }
      const first = createMatch(stage);
      expect(legalMoves(first, stage, "player").length).toBeGreaterThan(0);
      expect(legalMoves(first, stage, "ai").length).toBeGreaterThan(0);
    }
  });

  it.each(stages.map((stage) => [stage.id, stage] as const))(
    "%s: deterministic AI picks only an available move",
    (_id, stage) => {
      const initial = createMatch(stage);
      const first = legalMoves(initial, stage, "player")[0]!;
      const afterHuman = play(initial, stage, first)!;
      expect(afterHuman.turn).toBe("ai");
      const move = chooseAiMove(afterHuman, stage);
      expect(move).not.toBeNull();
      expect(legalMoves(afterHuman, stage, "ai")).toContain(move);
      expect(chooseAiMove(afterHuman, stage)).toBe(move);
      expect(play(afterHuman, stage, move!)?.moveCount).toBe(2);
      expect(chooseAiMove(initial, stage)).toBeNull();
    },
  );

  it("finishes a legal full match with no repeated positions", () => {
    const stage = stages[6]!;
    let game = createMatch(stage);
    let turns = 0;
    while (game.phase === "playing") {
      const move =
        game.turn === "ai"
          ? chooseAiMove(game, stage)
          : (legalMoves(game, stage, "player")[0] ?? null);
      expect(move).not.toBeNull();
      const result = play(game, stage, move!)!;
      expect(result.moveCount).toBe(game.moveCount + 1);
      game = result;
      if (++turns > TOTAL_CELLS) throw new Error("Infinite match");
    }
    expect(["won", "lost", "draw"]).toContain(game.phase);
    expect(turns).toBeLessThanOrEqual(TOTAL_CELLS - stage.rocks.length - 2);
  });
});

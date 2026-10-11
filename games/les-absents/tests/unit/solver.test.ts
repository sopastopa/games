import { describe, expect, it } from "vitest";
import { analyze, validateLevel } from "../../src/domain/graph";
import { levels } from "../../src/domain/levels";
import { findSolution } from "../../src/domain/solver";

describe("24 curated constellations", () => {
  it("contains 24 different and initially unsolved levels", () => {
    expect(levels).toHaveLength(24);
    expect(new Set(levels.map((level) => level.id)).size).toBe(24);
    for (const level of levels) {
      validateLevel(level);
      expect(analyze(level).solved, level.id).toBe(false);
    }
  });

  it.each(levels.map((level) => [level.id, level] as const))(
    "%s has a proven solution requiring exactly its removal budget",
    (_id, level) => {
      const solution = findSolution(level);
      expect(solution, level.id).not.toBeNull();
      expect(solution!.removed).toHaveLength(level.par);
      expect(analyze(level, new Set(solution!.removed)).solved).toBe(true);
      const partial = solution!.removed.slice(0, 1);
      const continued = findSolution(level, partial);
      expect(continued?.removed).toEqual(solution!.removed);
      expect(findSolution(level, ["source"])).toBeNull();
      expect(
        findSolution(
          level,
          Array(level.par + 1)
            .fill("n1")
            .map((_, index) => `n${index + 1}`),
        ),
      ).toBeNull();
    },
  );

  it("accepts a solved board and rejects an impossible forced removal", () => {
    const level = levels[0]!;
    const solution = findSolution(level)!;
    expect(findSolution(level, solution.removed)?.removed).toEqual(
      solution.removed,
    );
    const wrong = level.nodes.find(
      (node) => node.role === "neutral" && !solution.removed.includes(node.id),
    )!;
    expect(findSolution(level, [wrong.id])).toBeNull();
  });
});

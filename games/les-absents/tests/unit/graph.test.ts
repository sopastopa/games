import { describe, expect, it } from "vitest";
import { analyze, validateLevel } from "../../src/domain/graph";
import { levels } from "../../src/domain/levels";
import type { Level } from "../../src/domain/types";

describe("relational graph", () => {
  it("builds one undirected link per nearest-neighbor pair", () => {
    const level: Level = {
      id: "test",
      title: "Test",
      subtitle: "Test",
      chapter: "Test",
      par: 1,
      nodes: [
        { id: "source", x: 10, y: 10, role: "source" },
        { id: "n1", x: 20, y: 10, role: "neutral" },
        { id: "target-a", x: 50, y: 10, role: "receiver" },
        { id: "target-b", x: 60, y: 10, role: "receiver" },
        { id: "danger", x: 90, y: 10, role: "hazard" },
      ],
    };
    const first = analyze(level);
    expect(first.edges).toContainEqual({ from: "n1", to: "source" });
    expect(first.edges).toContainEqual({ from: "target-a", to: "target-b" });
    expect(first.energized.has("n1")).toBe(true);
    expect(first.energized.has("target-a")).toBe(false);
    const removed = analyze(level, new Set(["n1"]));
    expect(
      removed.edges.some((edge) => edge.from === "n1" || edge.to === "n1"),
    ).toBe(false);
    expect(removed.edges).toContainEqual({ from: "source", to: "target-a" });
  });

  it("breaks equal-distance ties deterministically by node ID", () => {
    const level: Level = {
      ...levels[0]!,
      nodes: [
        { id: "source", x: 50, y: 50, role: "source" },
        { id: "n2", x: 40, y: 50, role: "neutral" },
        { id: "n1", x: 60, y: 50, role: "neutral" },
        { id: "target-a", x: 10, y: 10, role: "receiver" },
        { id: "target-b", x: 90, y: 90, role: "receiver" },
        { id: "danger", x: 10, y: 90, role: "hazard" },
      ],
    };
    const result = analyze(level);
    expect(result.edges).toContainEqual({ from: "n1", to: "source" });
  });

  it("rejects duplicate IDs, out-of-range coordinates and missing roles", () => {
    const level = levels[0]!;
    validateLevel(level);
    expect(() =>
      validateLevel({ ...level, nodes: [...level.nodes, level.nodes[0]!] }),
    ).toThrow(/Duplicate/);
    expect(() =>
      validateLevel({
        ...level,
        nodes: [{ ...level.nodes[0]!, x: -1 }, ...level.nodes.slice(1)],
      }),
    ).toThrow(/Out-of-bounds/);
    expect(() =>
      validateLevel({
        ...level,
        nodes: level.nodes.filter((node) => node.role !== "hazard"),
      }),
    ).toThrow(/hazard/);
  });
});

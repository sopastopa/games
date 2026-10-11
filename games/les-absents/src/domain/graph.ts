import type { Analysis, Edge, Level, Node } from "./types";

const squaredDistance = (a: Node, b: Node): number =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export function analyze(
  level: Level,
  removed: ReadonlySet<string> = new Set(),
): Analysis {
  const visible = level.nodes.filter((node) => !removed.has(node.id));
  const links = new Map<string, Set<string>>(
    visible.map((node) => [node.id, new Set<string>()]),
  );
  const edges: Edge[] = [];
  const seen = new Set<string>();

  for (const node of visible) {
    const closest = visible
      .filter((other) => other.id !== node.id)
      .sort(
        (a, b) =>
          squaredDistance(node, a) - squaredDistance(node, b) ||
          a.id.localeCompare(b.id),
      )[0];
    if (!closest) continue;
    const ids = [node.id, closest.id].sort();
    const from = ids[0]!;
    const to = ids[1]!;
    const key = `${from}:${to}`;
    if (!seen.has(key)) {
      seen.add(key);
      edges.push({ from, to });
    }
    links.get(node.id)!.add(closest.id);
    links.get(closest.id)!.add(node.id);
  }

  const energized = new Set<string>();
  const source = visible.find((node) => node.role === "source");
  if (source) {
    const queue = [source.id];
    energized.add(source.id);
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index]!;
      for (const next of links.get(current) ?? []) {
        if (!energized.has(next)) {
          energized.add(next);
          queue.push(next);
        }
      }
    }
  }

  const receivers = level.nodes.filter((node) => node.role === "receiver");
  const receiversPowered = receivers.filter((node) =>
    energized.has(node.id),
  ).length;
  const hazardPowered = level.nodes.some(
    (node) => node.role === "hazard" && energized.has(node.id),
  );
  return {
    edges,
    energized,
    receiversPowered,
    receiversTotal: receivers.length,
    hazardPowered,
    solved:
      receivers.length > 0 &&
      receiversPowered === receivers.length &&
      !hazardPowered,
  };
}

export function validateLevel(level: Level): void {
  if (!/^[a-z0-9-]+$/.test(level.id)) throw new Error("Invalid level ID");
  if (!Number.isInteger(level.par) || level.par < 1)
    throw new Error(`Invalid removal budget: ${level.id}`);
  const ids = new Set<string>();
  for (const node of level.nodes) {
    if (ids.has(node.id)) throw new Error(`Duplicate node: ${node.id}`);
    if (
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y) ||
      node.x < 6 ||
      node.x > 94 ||
      node.y < 6 ||
      node.y > 94
    ) {
      throw new Error(`Out-of-bounds node: ${node.id}`);
    }
    ids.add(node.id);
  }
  for (const [role, number] of [
    ["source", 1],
    ["receiver", 2],
    ["hazard", 1],
  ] as const) {
    if (level.nodes.filter((node) => node.role === role).length !== number)
      throw new Error(`Invalid ${role} count: ${level.id}`);
  }
  if (level.nodes.filter((node) => node.role === "neutral").length < level.par)
    throw new Error(`Not enough neutral nodes: ${level.id}`);
}

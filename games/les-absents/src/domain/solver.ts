import { analyze } from "./graph";
import type { Level, Solution } from "./types";

// Exhaustive search, ordered by the fewest additional removals.
// A solution must retain every node already removed by the player.
export function findSolution(
  level: Level,
  currentRemoved: readonly string[] = [],
): Solution | null {
  const neutral = level.nodes
    .filter((node) => node.role === "neutral")
    .map((node) => node.id);
  const availableIds = new Set(neutral);
  const locked = [...new Set(currentRemoved)];
  if (locked.length > level.par || locked.some((id) => !availableIds.has(id))) {
    return null;
  }
  const optional = neutral.filter((id) => !locked.includes(id));
  for (let extra = 0; extra <= level.par - locked.length; extra++) {
    const picks: string[] = [];
    const choose = (start: number): Solution | null => {
      if (picks.length === extra) {
        const removed = [...locked, ...picks];
        return analyze(level, new Set(removed)).solved ? { removed } : null;
      }
      for (let index = start; index < optional.length; index++) {
        picks.push(optional[index]!);
        const result = choose(index + 1);
        picks.pop();
        if (result) return result;
      }
      return null;
    };
    const solution = choose(0);
    if (solution) return solution;
  }
  return null;
}

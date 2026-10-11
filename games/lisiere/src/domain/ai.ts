import { legalMoves, neighbors, opponent, play, points } from "./rules";
import { HOMES } from "./stages";
import type { Match, Side, Stage } from "./types";

function evaluate(match: Match, stage: Stage): number {
  const tally = points(match, stage);
  if (match.phase !== "playing") {
    return match.phase === "lost"
      ? 100_000
      : match.phase === "won"
        ? -100_000
        : 0;
  }
  const mobility =
    legalMoves(match, stage, "ai").length -
    legalMoves(match, stage, "player").length;
  const hubs = stage.sanctuaries.reduce((sum, index) => {
    if (match.owners[index]) return sum;
    const adjacent = neighbors(index);
    const ai = adjacent.filter((cell) => match.owners[cell] === "ai").length;
    const human = adjacent.filter(
      (cell) => match.owners[cell] === "player",
    ).length;
    return sum + (ai - human) * 1.8;
  }, 0);
  return (tally.ai - tally.player) * 14 + mobility * 1.1 + hubs;
}

function orderedMoves(
  match: Match,
  stage: Stage,
  maximizer: boolean,
): number[] {
  return legalMoves(match, stage, match.turn)
    .map((index) => ({
      index,
      score: evaluate(play(match, stage, index)!, stage),
    }))
    .sort(
      (a, b) =>
        (maximizer ? b.score - a.score : a.score - b.score) ||
        a.index - b.index,
    )
    .map((move) => move.index);
}

function search(
  match: Match,
  stage: Stage,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (!depth || match.phase !== "playing") return evaluate(match, stage);
  const maximize = match.turn === "ai";
  let best = maximize ? -Infinity : Infinity;
  const moves = orderedMoves(match, stage, maximize).slice(
    0,
    depth > 1 ? 9 : 12,
  );
  if (!moves.length) return evaluate(match, stage);
  for (const index of moves) {
    const next = play(match, stage, index)!;
    const candidate = search(next, stage, depth - 1, alpha, beta);
    best = maximize ? Math.max(best, candidate) : Math.min(best, candidate);
    if (maximize) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

export function chooseAiMove(match: Match, stage: Stage): number | null {
  if (match.phase !== "playing" || match.turn !== "ai") return null;
  const moves = orderedMoves(match, stage, true);
  if (!moves.length) return null;
  let bestMove = moves[0]!;
  let bestScore = -Infinity;
  for (const move of moves) {
    const next = play(match, stage, move)!;
    // Max root, then alternate sides only when that side has a legal move.
    const score = search(next, stage, stage.depth - 1, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

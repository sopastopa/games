import { BOARD_SIZE, HOMES, TOTAL_CELLS } from "./stages";
import type { Match, Owner, Phase, Scores, Side, Stage } from "./types";

export const opponent = (side: Side): Side =>
  side === "player" ? "ai" : "player";

export function neighbors(index: number): number[] {
  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_CELLS) return [];
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  const result: number[] = [];
  if (row > 0) result.push(index - BOARD_SIZE);
  if (col < BOARD_SIZE - 1) result.push(index + 1);
  if (row < BOARD_SIZE - 1) result.push(index + BOARD_SIZE);
  if (col > 0) result.push(index - 1);
  return result;
}

export function createMatch(stage: Stage): Match {
  validateStage(stage);
  const owners: Owner[] = Array(TOTAL_CELLS).fill(null);
  owners[HOMES.player] = "player";
  owners[HOMES.ai] = "ai";
  return {
    owners,
    turn: "player",
    phase: "playing",
    moveCount: 0,
    lastMove: null,
    captured: [],
  };
}

export function validateStage(stage: Stage): void {
  const rocks = new Set(stage.rocks);
  const sanctuaries = new Set(stage.sanctuaries);
  for (const set of [rocks, sanctuaries]) {
    for (const index of set) {
      if (!Number.isInteger(index) || index < 0 || index >= TOTAL_CELLS)
        throw new Error(`Invalid tile in ${stage.id}`);
    }
  }
  if (
    rocks.size !== stage.rocks.length ||
    sanctuaries.size !== stage.sanctuaries.length ||
    rocks.has(HOMES.player) ||
    rocks.has(HOMES.ai) ||
    [...rocks].some((index) => sanctuaries.has(index)) ||
    !Number.isInteger(stage.depth) ||
    stage.depth < 1 ||
    stage.depth > 3
  ) throw new Error(`Invalid terrain: ${stage.id}`);
}

export function legalMoves(match: Match, stage: Stage, side: Side): number[] {
  if (match.phase !== "playing") return [];
  const rocks = new Set(stage.rocks);
  return match.owners.flatMap((owner, index) =>
    owner === null &&
    !rocks.has(index) &&
    neighbors(index).some((neighbor) => match.owners[neighbor] === side)
      ? [index]
      : [],
  );
}

export function points(match: Match, stage: Stage): Scores {
  const hubs = new Set(stage.sanctuaries);
  return match.owners.reduce<Scores>(
    (score, owner, index) => {
      if (!owner) return score;
      const weight = hubs.has(index) ? 3 : 1;
      return { ...score, [owner]: score[owner] + weight };
    },
    { player: 0, ai: 0 },
  );
}

function terminal(match: Match, stage: Stage): Phase {
  const tally = points(match, stage);
  return tally.player > tally.ai ? "won" : tally.ai > tally.player ? "lost" : "draw";
}

export function play(match: Match, stage: Stage, index: number): Match | null {
  if (match.phase !== "playing") return null;
  if (!legalMoves(match, stage, match.turn).includes(index)) return null;
  const actor = match.turn;
  const owners = [...match.owners];
  owners[index] = actor;
  // Convert enemy tiles with at least two attackers adjacent. Capitals are
  // permanent; every captured cell is based on the pre-conversion positions.
  const captured: number[] = [];
  owners.forEach((owner, cell) => {
    if (
      owner === opponent(actor) &&
      cell !== HOMES.player &&
      cell !== HOMES.ai &&
      neighbors(cell).filter((neighbor) => owners[neighbor] === actor).length >= 2
    ) captured.push(cell);
  });
  for (const cell of captured) owners[cell] = actor;
  const draft: Match = {
    owners,
    turn: opponent(actor),
    phase: "playing",
    moveCount: match.moveCount + 1,
    lastMove: index,
    captured,
  };
  const nextSide = legalMoves(draft, stage, draft.turn);
  if (nextSide.length) return draft;
  const sameSide = legalMoves(draft, stage, actor);
  if (sameSide.length) return { ...draft, turn: actor };
  return { ...draft, phase: terminal(draft, stage) };
}

export function winnerLabel(phase: Phase): string {
  return ({
    playing: "En cours",
    won: "Victoire",
    lost: "Défaite",
    draw: "Égalité",
  } as const)[phase];
}

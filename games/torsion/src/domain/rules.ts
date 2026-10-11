import type { Puzzle, Stage } from "./types";

export function square(size: number, anchor: number): readonly number[] | null {
  if (
    !Number.isInteger(size) ||
    size < 2 ||
    !Number.isInteger(anchor) ||
    anchor < 0 ||
    anchor >= size * size ||
    anchor % size === size - 1 ||
    Math.floor(anchor / size) === size - 1
  )
    return null;
  return [anchor, anchor + 1, anchor + size, anchor + size + 1];
}

export function canTurn(stage: Stage, anchor: number): boolean {
  const cells = square(stage.size, anchor);
  return cells !== null && cells.every((cell) => !stage.rocks.includes(cell));
}

export function rotate(
  tiles: readonly number[],
  stage: Stage,
  anchor: number,
  reverse = false,
): readonly number[] {
  if (tiles.length !== stage.size * stage.size || !canTurn(stage, anchor))
    return tiles;
  const cells = square(stage.size, anchor)!;
  const values = cells.map((cell) => tiles[cell]!);
  const rotated = reverse
    ? [values[1]!, values[3]!, values[0]!, values[2]!]
    : [values[2]!, values[0]!, values[3]!, values[1]!];
  if (values.every((value, index) => value === rotated[index])) return tiles;
  const next = [...tiles];
  cells.forEach((cell, index) => {
    next[cell] = rotated[index]!;
  });
  return next;
}

export function solved(tiles: readonly number[], stage: Stage): boolean {
  return stage.goals.every((cell, index) => tiles[cell] === index + 1);
}

export function validateStage(stage: Stage): void {
  if (stage.size < 3 || !Number.isInteger(stage.size))
    throw new Error("Invalid board size: " + stage.id);
  if (!stage.goals.length || !stage.scramble.length)
    throw new Error("Empty stage: " + stage.id);
  const bounds = stage.size * stage.size;
  const positions = [...stage.goals, ...stage.rocks];
  if (
    positions.some((cell) => !Number.isInteger(cell) || cell < 0 || cell >= bounds) ||
    new Set(positions).size !== positions.length ||
    stage.scramble.some((anchor) => !canTurn(stage, anchor))
  )
    throw new Error("Invalid stage layout: " + stage.id);
}

export function initialPuzzle(stage: Stage): Puzzle {
  validateStage(stage);
  const tiles = Array<number>(stage.size * stage.size).fill(0);
  stage.goals.forEach((cell, index) => {
    tiles[cell] = index + 1;
  });
  let scrambled: readonly number[] = tiles;
  for (const anchor of stage.scramble)
    scrambled = rotate(scrambled, stage, anchor, true);
  if (solved(scrambled, stage))
    throw new Error("Already solved: " + stage.id);
  return { tiles: scrambled, moves: 0, phase: "playing" };
}

export function playTurn(puzzle: Puzzle, stage: Stage, anchor: number): Puzzle {
  if (puzzle.phase !== "playing") return puzzle;
  const tiles = rotate(puzzle.tiles, stage, anchor);
  if (tiles === puzzle.tiles) return puzzle;
  return {
    tiles,
    moves: puzzle.moves + 1,
    phase: solved(tiles, stage) ? "solved" : "playing",
  };
}

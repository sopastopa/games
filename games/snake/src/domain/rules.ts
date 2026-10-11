import type { Direction, GameState, Point, Random } from "./types";

const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const equal = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;

export function chooseFood(
  snake: readonly Point[],
  columns: number,
  rows: number,
  random: Random,
): Point | null {
  const free: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const cell = { x, y };
      if (!snake.some((segment) => equal(segment, cell))) free.push(cell);
    }
  }
  if (free.length === 0) return null;
  const value = random();
  const fraction = Number.isFinite(value)
    ? Math.min(0.999999999999, Math.max(0, value))
    : 0;
  return free[Math.floor(fraction * free.length)] ?? null;
}

export function createGame(
  columns: number,
  rows: number,
  random: Random,
): GameState {
  if (
    !Number.isInteger(columns) ||
    !Number.isInteger(rows) ||
    columns < 4 ||
    rows < 4
  ) {
    throw new RangeError("Grid must have at least 4 columns and rows");
  }
  const x = Math.floor(columns / 2);
  const y = Math.floor(rows / 2);
  const snake = [
    { x, y },
    { x: x - 1, y },
    { x: x - 2, y },
  ];
  return {
    columns,
    rows,
    snake,
    direction: "right",
    nextDirection: "right",
    food: chooseFood(snake, columns, rows, random),
    score: 0,
    status: "ready",
  };
}

export function startGame(state: GameState): GameState {
  return state.status === "ready" || state.status === "paused"
    ? { ...state, status: "running" }
    : state;
}

export function togglePause(state: GameState): GameState {
  if (state.status === "running") return { ...state, status: "paused" };
  if (state.status === "paused") return { ...state, status: "running" };
  return state;
}

export function changeDirection(
  state: GameState,
  direction: Direction,
): GameState {
  if (state.status !== "running" && state.status !== "ready") return state;
  const current = vectors[state.direction];
  const candidate = vectors[direction];
  if (current.x + candidate.x === 0 && current.y + candidate.y === 0)
    return state;
  return { ...state, nextDirection: direction };
}

export function tick(state: GameState, random: Random): GameState {
  if (state.status !== "running") return state;
  const movement = vectors[state.nextDirection];
  const head = state.snake[0]!;
  const next = { x: head.x + movement.x, y: head.y + movement.y };
  const eating = state.food !== null && equal(next, state.food);
  const occupied = eating ? state.snake : state.snake.slice(0, -1);
  if (
    next.x < 0 ||
    next.y < 0 ||
    next.x >= state.columns ||
    next.y >= state.rows ||
    occupied.some((segment) => equal(segment, next))
  ) {
    return { ...state, direction: state.nextDirection, status: "lost" };
  }
  const snake = eating
    ? [next, ...state.snake]
    : [next, ...state.snake.slice(0, -1)];
  const food = eating
    ? chooseFood(snake, state.columns, state.rows, random)
    : state.food;
  return {
    ...state,
    snake,
    direction: state.nextDirection,
    score: state.score + (eating ? 10 : 0),
    food,
    status: food === null ? "won" : "running",
  };
}

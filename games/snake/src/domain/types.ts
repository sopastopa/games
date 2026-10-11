export type Direction = "up" | "down" | "left" | "right";
export type Status = "ready" | "running" | "paused" | "lost" | "won";
export type Point = Readonly<{ x: number; y: number }>;
export type Random = () => number;
export type GameState = Readonly<{
  columns: number;
  rows: number;
  snake: readonly Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point | null;
  score: number;
  status: Status;
}>;

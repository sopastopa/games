export type Phase = "ready" | "running" | "paused" | "lost";
export type Result = "good" | "perfect" | "miss" | null;
export type GameState = Readonly<{
  phase: Phase;
  angle: number;
  target: number;
  halfWindow: number;
  speed: number;
  direction: 1 | -1;
  hits: number;
  score: number;
  perfects: number;
  lastResult: Result;
}>;
export type Random = () => number;

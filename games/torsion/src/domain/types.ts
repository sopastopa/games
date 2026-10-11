export type Stage = Readonly<{
  id: string;
  title: string;
  lesson: string;
  insight: string;
  chapter: string;
  size: number;
  goals: readonly number[];
  rocks: readonly number[];
  scramble: readonly number[];
}>;

export type Phase = "playing" | "solved";

export type Puzzle = Readonly<{
  tiles: readonly number[];
  moves: number;
  phase: Phase;
}>;

export type GameView = Readonly<{
  stage: Stage;
  stageIndex: number;
  puzzle: Puzzle;
  canUndo: boolean;
  unlocked: number;
  completed: number;
  best: number | null;
}>;

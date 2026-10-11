export type Side = "player" | "ai";
export type Owner = Side | null;
export type Phase = "playing" | "won" | "lost" | "draw";

export type Stage = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  chapter: string;
  depth: number;
  rocks: readonly number[];
  sanctuaries: readonly number[];
}>;

export type Match = Readonly<{
  owners: readonly Owner[];
  turn: Side;
  phase: Phase;
  moveCount: number;
  lastMove: number | null;
  captured: readonly number[];
}>;

export type Scores = Readonly<{ player: number; ai: number }>;

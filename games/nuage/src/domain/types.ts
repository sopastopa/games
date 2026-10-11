export type Palette = Readonly<{
  sky: string;
  horizon: string;
  ground: string;
  hill: string;
  hillFar: string;
  ink: string;
  glow: string;
  companion: string;
}>;

export type Obstacle = Readonly<{
  x: number;
  width: number;
  kind: "ink" | "gap" | "arch" | "orb";
  bottom?: number;
  centerY?: number;
  amplitude?: number;
  frequency?: number;
  phase?: number;
}>;
export type Wind = Readonly<{ x: number; width: number; lift: number }>;
export type Spark = Readonly<{ x: number; y: number }>;

export type Chapter = Readonly<{
  id: string;
  title: string;
  place: string;
  number: string;
  motif:
    | "flowers"
    | "lanterns"
    | "candy"
    | "forest"
    | "sea"
    | "night"
    | "rainbow";
  opening: string;
  middle: string;
  ending: string;
  colorName: string;
  palette: Palette;
  endX: number;
  checkpoint: number;
  speed: number;
  airJump: boolean;
  lesson: string;
  concept: string;
  obstacles: readonly Obstacle[];
  winds: readonly Wind[];
  sparks: readonly Spark[];
}>;

export type Phase = "ready" | "running" | "paused" | "complete";

export type Run = Readonly<{
  phase: Phase;
  x: number;
  y: number;
  vy: number;
  grounded: boolean;
  grace: number;
  airJumps: number;
  elapsed: number;
  glide: number;
  checkpoint: number;
  tries: number;
  lastHit: Obstacle["kind"] | null;
  sparks: readonly number[];
  beat: "opening" | "middle" | "ending";
}>;

export type Progress = Readonly<{
  unlocked: number;
  selected: number;
  finished: readonly string[];
  collected: Readonly<Record<string, number>>;
  promenade: boolean;
}>;

export type View = Readonly<{
  chapter: Chapter;
  chapterIndex: number;
  run: Run;
  progress: Progress;
  finishedCount: number;
  canContinue: boolean;
}>;

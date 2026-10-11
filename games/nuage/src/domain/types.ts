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

export type Obstacle = Readonly<{ x: number; width: number }>;
export type Spark = Readonly<{ x: number; y: number }>;

export type Chapter = Readonly<{
  id: string;
  title: string;
  place: string;
  number: string;
  motif: "flowers" | "lanterns" | "candy" | "forest" | "sea" | "night" | "rainbow";
  opening: string;
  middle: string;
  ending: string;
  colorName: string;
  palette: Palette;
  endX: number;
  checkpoint: number;
  obstacles: readonly Obstacle[];
  sparks: readonly Spark[];
}>;

export type Phase = "ready" | "running" | "paused" | "complete";

export type Run = Readonly<{
  phase: Phase;
  x: number;
  y: number;
  vy: number;
  grounded: boolean;
  glide: number;
  checkpoint: number;
  tries: number;
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

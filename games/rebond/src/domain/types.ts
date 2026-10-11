export type Vec2 = Readonly<{ x: number; y: number }>;
export type Bumper = Readonly<{
  id: string;
  x: number;
  y: number;
  radius: number;
}>;
export type Level = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  chapter: string;
  source: Vec2;
  goal: Vec2;
  goalRadius: number;
  bumpers: readonly Bumper[];
  /** Ordered mandatory ricochets; the goal is locked until they are completed. */
  required: readonly string[];
  reference: Readonly<{ angle: number; speed: number; time: number }>;
}>;
export type Phase = "ready" | "flying" | "solved" | "missed";
export type Ball = Readonly<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  elapsed: number;
}>;
export type Motion = Readonly<{
  ball: Ball;
  hitGoal: boolean;
  expired: boolean;
  contacts: readonly string[];
}>;

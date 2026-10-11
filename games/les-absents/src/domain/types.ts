export type Role = "source" | "receiver" | "hazard" | "neutral";

export type Node = Readonly<{
  id: string;
  x: number;
  y: number;
  role: Role;
}>;

export type Level = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  chapter: string;
  par: number;
  nodes: readonly Node[];
}>;

export type Edge = Readonly<{ from: string; to: string }>;

export type Analysis = Readonly<{
  edges: readonly Edge[];
  energized: ReadonlySet<string>;
  receiversPowered: number;
  receiversTotal: number;
  hazardPowered: boolean;
  solved: boolean;
}>;

export type Solution = Readonly<{ removed: readonly string[] }>;

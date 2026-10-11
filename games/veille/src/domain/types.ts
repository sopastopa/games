export type Role = "scout" | "engineer" | "guardian";
export type Terrain = "floor" | "wall" | "tide" | "core" | "battery" | "beacon" | "archive" | "exit";
export type Direction = "up" | "down" | "left" | "right";
export type Action = { kind: "move" | "dash"; direction: Direction } | { kind: "scan" } | { kind: "pulse" } | { kind: "wait" };
export type Phase = "playing" | "won" | "lost";

export interface Drone {
  position: number;
  home: number;
  stunned: number;
}
export interface Expedition {
  sector: number;
  seed: number;
  role: Role;
  terrain: Terrain[];
  revealed: boolean[];
  position: number;
  hull: number;
  maxHull: number;
  energy: number;
  cores: number;
  required: number;
  archives: number;
  turn: number;
  phase: Phase;
  drones: Drone[];
  log: string;
}
export interface Campaign {
  unlocked: number;
  completed: number[];
  bestTurns: Record<string, number>;
  discoveries: string[];
  launches: number;
  run: Expedition | null;
}
export interface Sector {
  title: string;
  region: string;
  clue: string;
  chronicle: string;
  accent: string;
}
export const SIZE = 9;
export const START = SIZE + 1;
export const EXIT = SIZE * (SIZE - 2) + SIZE - 2;
export const MAX_ENERGY = 7;
export const SECTOR_COUNT = 12;

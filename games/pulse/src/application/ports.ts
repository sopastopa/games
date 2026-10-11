import type { GameState } from "../domain/types";

export interface Clock {
  begin(onFrame: (deltaSeconds: number) => void): () => void;
}
export interface BestStore {
  read(): number;
  write(score: number): void;
}
export interface Effects {
  hit(perfect: boolean): void;
  miss(): void;
}
export interface Ports {
  clock: Clock;
  store: BestStore;
  effects: Effects;
  random: () => number;
}
export type Snapshot = Readonly<GameState & { bestScore: number }>;

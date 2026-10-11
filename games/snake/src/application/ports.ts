import type { GameState, Random } from "../domain/types";

export interface Clock {
  every(milliseconds: number, action: () => void): () => void;
}
export interface BestScoreStore {
  read(): number;
  write(score: number): void;
}
export interface Ports {
  clock: Clock;
  store: BestScoreStore;
  random: Random;
}
export type Snapshot = GameState & { bestScore: number };

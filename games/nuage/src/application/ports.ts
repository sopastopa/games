import type { Progress } from "../domain/types";

export interface ProgressStore {
  read(): Progress | null;
  write(progress: Progress): void;
}

export interface Clock {
  start(callback: (elapsedSeconds: number) => void): () => void;
}

export type Ports = Readonly<{ store: ProgressStore; clock: Clock }>;

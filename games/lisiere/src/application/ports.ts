export type Progress = Readonly<{
  unlocked: number;
  selected: number;
  wins: readonly string[];
}>;

export interface ProgressStore {
  read(): Progress | null;
  write(progress: Progress): void;
}

export interface Scheduler {
  schedule(callback: () => void, milliseconds: number): () => void;
}

export type Ports = Readonly<{
  store: ProgressStore;
  scheduler: Scheduler;
}>;

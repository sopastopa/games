export type Progress = Readonly<{
  unlocked: number;
  current: number;
  best: Readonly<Record<string, number>>;
}>;
export interface ProgressStore {
  read(): Progress | null;
  write(progress: Progress): void;
}
export interface Clock {
  begin(onFrame: (seconds: number) => void): () => void;
}
export type Ports = Readonly<{ clock: Clock; store: ProgressStore }>;

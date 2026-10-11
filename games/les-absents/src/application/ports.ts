export type Progress = Readonly<{
  unlocked: number;
  current: number;
  completed: readonly string[];
}>;

export interface ProgressStore {
  read(): Progress | null;
  write(progress: Progress): void;
}

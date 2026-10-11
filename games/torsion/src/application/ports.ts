export type Progress = Readonly<{
  unlocked: number;
  selected: number;
  bests: Readonly<Record<string, number>>;
}>;

export interface ProgressStore {
  read(): Progress | null;
  write(progress: Progress): void;
}

import { analyze } from "../domain/graph";
import { findSolution } from "../domain/solver";
import type { Analysis, Level } from "../domain/types";
import type { Progress, ProgressStore } from "./ports";

export type Snapshot = Readonly<{
  level: Level;
  levelIndex: number;
  levelCount: number;
  removed: readonly string[];
  analysis: Analysis;
  movesLeft: number;
  unlocked: number;
  completed: readonly string[];
  canUndo: boolean;
  canRedo: boolean;
}>;

export class AbsentsController {
  private levelIndex = 0;
  private unlocked = 0;
  private readonly completed = new Set<string>();
  private removed: string[] = [];
  private past: string[][] = [];
  private future: string[][] = [];
  private readonly subscribers = new Set<(snapshot: Snapshot) => void>();

  constructor(
    private readonly levels: readonly Level[],
    private readonly store: ProgressStore,
  ) {
    if (!levels.length) throw new Error("At least one level is required");
    const progress = store.read();
    if (progress) {
      this.unlocked = Math.min(
        levels.length - 1,
        Math.max(0, Math.floor(progress.unlocked) || 0),
      );
      this.levelIndex = Math.min(
        this.unlocked,
        Math.max(0, Math.floor(progress.current) || 0),
      );
      for (const id of progress.completed) {
        if (levels.some((level) => level.id === id)) this.completed.add(id);
      }
    }
  }

  get snapshot(): Snapshot {
    const level = this.levels[this.levelIndex]!;
    const analysis = analyze(level, new Set(this.removed));
    return {
      level,
      levelIndex: this.levelIndex,
      levelCount: this.levels.length,
      removed: [...this.removed],
      analysis,
      movesLeft: level.par - this.removed.length,
      unlocked: this.unlocked,
      completed: [...this.completed],
      canUndo: this.past.length > 0,
      canRedo: this.future.length > 0,
    };
  }

  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.subscribers.add(listener);
    listener(this.snapshot);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  selectLevel(index: number): boolean {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.levels.length ||
      index > this.unlocked
    )
      return false;
    this.levelIndex = index;
    this.clearBoard();
    this.save();
    this.notify();
    return true;
  }

  toggle(id: string): boolean {
    const before = this.snapshot;
    const node = before.level.nodes.find((item) => item.id === id);
    if (!node || node.role !== "neutral" || before.analysis.solved)
      return false;
    const removing = !this.removed.includes(id);
    if (removing && this.removed.length >= before.level.par) return false;
    this.past.push([...this.removed]);
    this.future = [];
    this.removed = removing
      ? [...this.removed, id]
      : this.removed.filter((item) => item !== id);
    this.recordVictory();
    this.notify();
    return true;
  }

  undo(): boolean {
    const previous = this.past.pop();
    if (!previous) return false;
    this.future.push([...this.removed]);
    this.removed = previous;
    this.notify();
    return true;
  }

  redo(): boolean {
    const next = this.future.pop();
    if (!next) return false;
    this.past.push([...this.removed]);
    this.removed = next;
    this.recordVictory();
    this.notify();
    return true;
  }

  reset(): void {
    this.clearBoard();
    this.notify();
  }

  nextLevel(): boolean {
    if (!this.snapshot.analysis.solved) return false;
    return this.selectLevel(this.levelIndex + 1);
  }

  hint(): string | null {
    const solution = findSolution(this.snapshot.level, this.removed);
    return solution?.removed.find((id) => !this.removed.includes(id)) ?? null;
  }

  private clearBoard(): void {
    this.removed = [];
    this.past = [];
    this.future = [];
  }

  private recordVictory(): void {
    if (!this.snapshot.analysis.solved) return;
    const current = this.levels[this.levelIndex]!;
    this.completed.add(current.id);
    this.unlocked = Math.max(
      this.unlocked,
      Math.min(this.levelIndex + 1, this.levels.length - 1),
    );
    this.save();
  }

  private save(): void {
    const progress: Progress = {
      unlocked: this.unlocked,
      current: this.levelIndex,
      completed: [...this.completed],
    };
    this.store.write(progress);
  }

  private notify(): void {
    const snapshot = this.snapshot;
    for (const subscriber of this.subscribers) subscriber(snapshot);
  }
}

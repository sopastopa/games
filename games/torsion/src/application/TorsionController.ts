import { STAGES } from "../domain/levels";
import { initialPuzzle, playTurn } from "../domain/rules";
import type { GameView, Puzzle } from "../domain/types";
import type { Progress, ProgressStore } from "./ports";

type Listener = (state: GameView) => void;

function normalize(progress: Progress | null): Progress {
  if (!progress) return { unlocked: 0, selected: 0, bests: {} };
  const unlocked =
    Number.isInteger(progress.unlocked) && progress.unlocked >= 0
      ? Math.min(progress.unlocked, STAGES.length - 1)
      : 0;
  const selected =
    Number.isInteger(progress.selected) &&
    progress.selected >= 0 &&
    progress.selected <= unlocked
      ? progress.selected
      : 0;
  const bests: Record<string, number> = {};
  for (const stage of STAGES) {
    const value = progress.bests?.[stage.id];
    if (typeof value === "number" && Number.isInteger(value) && value > 0)
      bests[stage.id] = value;
  }
  return { unlocked, selected, bests };
}

export class TorsionController {
  private readonly listeners = new Set<Listener>();
  private progress: Progress;
  private puzzle: Puzzle;
  private history: Puzzle[] = [];

  constructor(private readonly store: ProgressStore) {
    let saved: Progress | null = null;
    try {
      saved = store.read();
    } catch {
      // A failing adapter cannot prevent playing.
    }
    this.progress = normalize(saved);
    this.puzzle = initialPuzzle(STAGES[this.progress.selected]!);
  }

  get state(): GameView {
    const stage = STAGES[this.progress.selected]!;
    return {
      stage,
      stageIndex: this.progress.selected,
      puzzle: this.puzzle,
      canUndo: this.history.length > 0,
      unlocked: this.progress.unlocked,
      completed: Object.keys(this.progress.bests).length,
      best: this.progress.bests[stage.id] ?? null,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  turn(anchor: number): boolean {
    const next = playTurn(this.puzzle, this.state.stage, anchor);
    if (next === this.puzzle) return false;
    this.history.push(this.puzzle);
    this.puzzle = next;
    if (next.phase === "solved") this.complete();
    this.emit();
    return true;
  }

  undo(): boolean {
    const previous = this.history.pop();
    if (!previous) return false;
    this.puzzle = previous;
    this.emit();
    return true;
  }

  restart(): void {
    this.history = [];
    this.puzzle = initialPuzzle(this.state.stage);
    this.emit();
  }

  select(index: number): boolean {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > this.progress.unlocked ||
      index >= STAGES.length
    )
      return false;
    this.progress = { ...this.progress, selected: index };
    this.history = [];
    this.puzzle = initialPuzzle(STAGES[index]!);
    this.save();
    this.emit();
    return true;
  }

  next(): boolean {
    return this.select(this.progress.selected + 1);
  }

  private complete(): void {
    const stage = this.state.stage;
    const currentBest = this.progress.bests[stage.id];
    const bests =
      currentBest === undefined || this.puzzle.moves < currentBest
        ? { ...this.progress.bests, [stage.id]: this.puzzle.moves }
        : this.progress.bests;
    this.progress = {
      ...this.progress,
      unlocked: Math.min(
        STAGES.length - 1,
        Math.max(this.progress.unlocked, this.progress.selected + 1),
      ),
      bests,
    };
    this.save();
  }

  private save(): void {
    try {
      this.store.write(this.progress);
    } catch {
      // Persistence must never interrupt the game.
    }
  }

  private emit(): void {
    const state = this.state;
    for (const listener of this.listeners) listener(state);
  }
}

import { chooseAiMove } from "../domain/ai";
import { createMatch, legalMoves, play, points } from "../domain/rules";
import { stages as officialStages } from "../domain/stages";
import type { Match, Scores, Stage } from "../domain/types";
import type { Ports, Progress } from "./ports";

export type Snapshot = Readonly<{
  match: Match;
  stage: Stage;
  index: number;
  count: number;
  unlocked: number;
  wins: readonly string[];
  scores: Scores;
  available: readonly number[];
  thinking: boolean;
  canUndo: boolean;
  canContinue: boolean;
}>;

export class LisiereController {
  private index = 0;
  private unlocked = 0;
  private readonly wins = new Set<string>();
  private match: Match;
  private history: Match[] = [];
  private cancelAi: (() => void) | null = null;
  private readonly listeners = new Set<(snapshot: Snapshot) => void>();

  constructor(
    private readonly ports: Ports,
    private readonly stages: readonly Stage[] = officialStages,
  ) {
    if (!stages.length) throw new Error("At least one stage is required");
    const saved = ports.store.read();
    if (saved) {
      this.unlocked = Math.min(
        stages.length - 1,
        Math.max(0, Math.floor(saved.unlocked) || 0),
      );
      this.index = Math.min(
        this.unlocked,
        Math.max(0, Math.floor(saved.selected) || 0),
      );
      for (const id of saved.wins) {
        if (stages.some((stage) => stage.id === id)) this.wins.add(id);
      }
    }
    this.match = createMatch(this.current);
  }

  private get current(): Stage {
    return this.stages[this.index]!;
  }

  get snapshot(): Snapshot {
    return {
      match: this.match,
      stage: this.current,
      index: this.index,
      count: this.stages.length,
      unlocked: this.unlocked,
      wins: [...this.wins],
      scores: points(this.match, this.current),
      available:
        this.match.turn === "player" && !this.cancelAi
          ? legalMoves(this.match, this.current, "player")
          : [],
      thinking: this.cancelAi !== null,
      canUndo: this.history.length > 0,
      canContinue:
        this.match.phase === "won" && this.index < this.stages.length - 1,
    };
  }

  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => { this.listeners.delete(listener); };
  }

  move(index: number): boolean {
    if (this.cancelAi || this.match.turn !== "player") return false;
    const next = play(this.match, this.current, index);
    if (!next) return false;
    this.history.push(this.match);
    this.match = next;
    this.finishOrPlan();
    this.notify();
    return true;
  }

  undo(): boolean {
    const previous = this.history.pop();
    if (!previous) return false;
    this.stopAi();
    this.match = previous;
    this.notify();
    return true;
  }

  restart(): void {
    this.stopAi();
    this.history = [];
    this.match = createMatch(this.current);
    this.notify();
  }

  select(index: number): boolean {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > this.unlocked ||
      index >= this.stages.length
    ) return false;
    this.stopAi();
    this.index = index;
    this.restart();
    this.save();
    return true;
  }

  next(): boolean {
    if (!this.snapshot.canContinue) return false;
    return this.select(this.index + 1);
  }

  suspend(): void {
    this.stopAi();
    this.notify();
  }

  resume(): void {
    if (this.match.phase === "playing" && this.match.turn === "ai" && !this.cancelAi) {
      this.planAi();
      this.notify();
    }
  }

  destroy(): void {
    this.stopAi();
    this.listeners.clear();
  }

  private finishOrPlan(): void {
    if (this.match.phase !== "playing") {
      if (this.match.phase === "won") {
        this.wins.add(this.current.id);
        this.unlocked = Math.max(
          this.unlocked,
          Math.min(this.stages.length - 1, this.index + 1),
        );
        this.save();
      }
      return;
    }
    if (this.match.turn === "ai") this.planAi();
  }

  private planAi(): void {
    // The AI never blocks the browser thread while the user is choosing.
    this.cancelAi = this.ports.scheduler.schedule(() => {
      this.cancelAi = null;
      if (this.match.phase !== "playing" || this.match.turn !== "ai") return;
      const candidate = chooseAiMove(this.match, this.current);
      if (candidate === null) return;
      const next = play(this.match, this.current, candidate);
      if (!next) return;
      this.match = next;
      this.finishOrPlan();
      this.notify();
    }, 340);
  }

  private stopAi(): void {
    this.cancelAi?.();
    this.cancelAi = null;
  }

  private save(): void {
    const progress: Progress = {
      unlocked: this.unlocked,
      selected: this.index,
      wins: [...this.wins],
    };
    this.ports.store.write(progress);
  }

  private notify(): void {
    const current = this.snapshot;
    for (const listener of this.listeners) listener(current);
  }
}

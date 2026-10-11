import { advance, createGame, pause, start, tap } from "../domain/rules";
import type { GameState } from "../domain/types";
import type { Ports, Snapshot } from "./ports";

export class PulseController {
  private state: GameState = createGame();
  private bestScore: number;
  private cancelClock: (() => void) | null = null;
  private readonly listeners = new Set<(state: Snapshot) => void>();

  constructor(private readonly ports: Ports) {
    const best = ports.store.read();
    this.bestScore = Number.isSafeInteger(best) && best >= 0 ? best : 0;
  }

  get snapshot(): Snapshot {
    return { ...this.state, bestScore: this.bestScore };
  }

  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  action(): void {
    if (this.state.phase === "lost") {
      this.transition(start(createGame()));
      return;
    }
    if (this.state.phase === "ready" || this.state.phase === "paused") {
      this.transition(start(this.state));
      return;
    }
    const next = tap(this.state, this.ports.random);
    if (next.lastResult === "miss") {
      this.ports.effects.miss();
    } else if (next.lastResult) {
      this.ports.effects.hit(next.lastResult === "perfect");
    }
    if (next.score > this.bestScore) {
      this.bestScore = next.score;
      this.ports.store.write(this.bestScore);
    }
    this.transition(next);
  }

  togglePause(): void {
    this.transition(pause(this.state));
  }

  suspend(): void {
    if (this.state.phase === "running") this.transition(pause(this.state));
  }

  restart(): void {
    this.transition(createGame());
  }

  destroy(): void {
    this.cancelClock?.();
    this.cancelClock = null;
    this.listeners.clear();
  }

  private transition(next: GameState): void {
    const previousPhase = this.state.phase;
    this.state = next;
    if (previousPhase !== next.phase) {
      this.cancelClock?.();
      this.cancelClock = null;
      if (next.phase === "running") {
        this.cancelClock = this.ports.clock.begin((delta) => {
          this.state = advance(this.state, delta);
          this.notify();
        });
      }
    }
    this.notify();
  }

  private notify(): void {
    const current = this.snapshot;
    for (const listener of this.listeners) listener(current);
  }
}

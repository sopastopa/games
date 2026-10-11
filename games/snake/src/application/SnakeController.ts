import { changeDirection, createGame, startGame, tick, togglePause } from '../domain/rules';
import type { Direction, GameState } from '../domain/types';
import type { Ports, Snapshot } from './ports';

export class SnakeController {
  private state: GameState;
  private bestScore: number;
  private stopClock: (() => void) | undefined;
  private readonly subscribers = new Set<(snapshot: Snapshot) => void>();

  constructor(private readonly ports: Ports, private readonly columns = 16, private readonly rows = 16) {
    this.state = createGame(columns, rows, ports.random);
    const saved = ports.store.read();
    this.bestScore = Number.isFinite(saved) && saved >= 0 ? saved : 0;
  }

  get snapshot(): Snapshot { return { ...this.state, bestScore: this.bestScore }; }

  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.subscribers.add(listener);
    listener(this.snapshot);
    return () => { this.subscribers.delete(listener); };
  }

  start(): void { this.transition(startGame(this.state)); }
  pause(): void { this.transition(togglePause(this.state)); }
  turn(direction: Direction): void { this.transition(changeDirection(this.state, direction)); }
  restart(): void { this.transition(createGame(this.columns, this.rows, this.ports.random)); }

  private advance(): void {
    const next = tick(this.state, this.ports.random);
    if (next.score > this.bestScore) {
      this.bestScore = next.score;
      this.ports.store.write(next.score);
    }
    this.transition(next);
  }

  private transition(next: GameState): void {
    const before = this.state.status;
    this.state = next;
    if (next.status !== before) {
      this.stopClock?.();
      this.stopClock = undefined;
      if (next.status === 'running') this.stopClock = this.ports.clock.every(155, () => this.advance());
    }
    for (const subscriber of this.subscribers) subscriber(this.snapshot);
  }

  destroy(): void {
    this.stopClock?.();
    this.stopClock = undefined;
    this.subscribers.clear();
  }
}

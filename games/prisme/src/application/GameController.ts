import {
  createGame,
  stepGame,
  type Controls,
  type GameState,
} from "../domain/rules";
import { MAX_ZONE, SIZE, type Point } from "../domain/map";

export interface RecordData {
  bestZone: number;
  bestScore: number;
  lastSeed: number;
}

export interface RecordStore {
  load(): unknown;
  save(record: RecordData): void;
}

export function restoreRecord(value: unknown): RecordData {
  const empty: RecordData = { bestZone: 1, bestScore: 0, lastSeed: 48271 };
  if (!value || typeof value !== "object") return empty;
  const record = value as Partial<RecordData>;
  return {
    bestZone:
      Number.isInteger(record.bestZone) &&
      record.bestZone! >= 1 &&
      record.bestZone! <= MAX_ZONE
        ? record.bestZone!
        : empty.bestZone,
    bestScore:
      Number.isSafeInteger(record.bestScore) &&
      record.bestScore! >= 0 &&
      record.bestScore! <= 100000000
        ? record.bestScore!
        : empty.bestScore,
    lastSeed:
      Number.isSafeInteger(record.lastSeed) &&
      record.lastSeed! >= 1 &&
      record.lastSeed! <= 999999999
        ? record.lastSeed!
        : empty.lastSeed,
  };
}

export class GameController {
  private game: GameState;
  private record: RecordData;
  private readonly listeners = new Set<(state: GameState) => void>();

  constructor(private readonly store: RecordStore) {
    this.record = restoreRecord(store.load());
    this.game = createGame(this.record.lastSeed);
  }

  get state(): GameState {
    return this.game;
  }

  get best(): RecordData {
    return this.record;
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    listener(this.game);
    return () => this.listeners.delete(listener);
  }

  private publish(): void {
    for (const listener of this.listeners) listener(this.game);
  }

  start(seed: number): boolean {
    if (!Number.isSafeInteger(seed) || seed < 1 || seed > 999999999)
      return false;
    this.game = { ...createGame(seed), phase: "playing" };
    this.record = { ...this.record, lastSeed: seed };
    this.store.save(this.record);
    this.publish();
    return true;
  }

  nextZone(): boolean {
    if (this.game.phase !== "cleared") return false;
    this.game = {
      ...createGame(this.game.seed, this.game.zone + 1),
      phase: "playing",
      score: this.game.score,
    };
    this.publish();
    return true;
  }

  restart(): void {
    this.game = {
      ...createGame(this.game.seed, this.game.zone),
      phase: "playing",
    };
    this.publish();
  }

  togglePlan(): void {
    if (this.game.phase === "playing") this.game = { ...this.game, phase: "planning" };
    else if (this.game.phase === "planning") this.game = { ...this.game, phase: "playing" };
    this.publish();
  }

  setWaypoint(point: Point): boolean {
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    if (this.game.phase !== "planning" || x < 1 || y < 1 || x >= SIZE - 1 || y >= SIZE - 1 || !this.game.explored[y * SIZE + x]) return false;
    this.game = { ...this.game, waypoint: { x, y } };
    this.publish();
    return true;
  }

  togglePause(): void {
    if (this.game.phase === "playing")
      this.game = { ...this.game, phase: "paused" };
    else if (this.game.phase === "paused")
      this.game = { ...this.game, phase: "playing" };
    this.publish();
  }

  pause(): void {
    if (this.game.phase === "playing") {
      this.game = { ...this.game, phase: "paused" };
      this.publish();
    }
  }

  tick(input: Controls): void {
    if (this.game.phase !== "playing") return;
    const previous = this.game.phase;
    this.game = stepGame(this.game, input);
    if (previous !== this.game.phase) {
      if (this.game.phase === "cleared" || this.game.phase === "won") {
        this.record = {
          ...this.record,
          bestZone: Math.max(this.record.bestZone, this.game.zone),
          bestScore: Math.max(this.record.bestScore, this.game.score),
        };
        this.store.save(this.record);
      }
    }
    this.publish();
  }

  dispose(): void {
    this.listeners.clear();
  }
}

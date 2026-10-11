import { advance, BALL_RADIUS, launch, STEP } from "../domain/physics";
import { levels as officialLevels } from "../domain/levels";
import type { Ball, Level, Phase } from "../domain/types";
import type { Ports, Progress } from "./ports";

export type Snapshot = Readonly<{
  level: Level;
  index: number;
  count: number;
  unlocked: number;
  best: Readonly<Record<string, number>>;
  phase: Phase;
  ball: Ball;
  attempts: number;
  angle: number;
  speed: number;
  canContinue: boolean;
  starCount: number;
}>;

export class RebondController {
  private index = 0;
  private unlocked = 0;
  private best: Record<string, number> = {};
  private phase: Phase = "ready";
  private attempts = 0;
  private angle = 42;
  private speed = 580;
  private ball: Ball;
  private accumulator = 0;
  private cancelClock: (() => void) | null = null;
  private readonly listeners = new Set<(snapshot: Snapshot) => void>();

  constructor(
    private readonly ports: Ports,
    private readonly stages: readonly Level[] = officialLevels,
  ) {
    if (!stages.length) throw new Error("At least one level required");
    const progress = ports.store.read();
    if (progress) {
      this.unlocked = Math.min(
        stages.length - 1,
        Math.max(0, Math.floor(progress.unlocked) || 0),
      );
      this.index = Math.min(
        this.unlocked,
        Math.max(0, Math.floor(progress.current) || 0),
      );
      this.best = { ...progress.best };
    }
    this.ball = launch(this.current.source, this.angle, 0);
  }

  private get current(): Level {
    return this.stages[this.index]!;
  }

  get snapshot(): Snapshot {
    const record = this.best[this.current.id] ?? 0;
    return {
      level: this.current,
      index: this.index,
      count: this.stages.length,
      unlocked: this.unlocked,
      best: { ...this.best },
      phase: this.phase,
      ball: { ...this.ball },
      attempts: this.attempts,
      angle: this.angle,
      speed: this.speed,
      canContinue:
        this.phase === "solved" && this.index < this.stages.length - 1,
      starCount:
        this.phase === "solved"
          ? this.stars(this.attempts)
          : record
            ? this.stars(record)
            : 0,
    };
  }

  subscribe(listener: (state: Snapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  aim(angle: number, speed: number): boolean {
    if (this.phase !== "ready") return false;
    if (!Number.isFinite(angle) || !Number.isFinite(speed)) return false;
    this.angle = Math.max(8, Math.min(82, angle));
    this.speed = Math.max(420, Math.min(810, speed));
    this.notify();
    return true;
  }

  adjust(angleDelta: number, speedDelta: number): boolean {
    return this.aim(this.angle + angleDelta, this.speed + speedDelta);
  }

  shoot(): boolean {
    if (this.phase !== "ready") return false;
    this.ball = launch(this.current.source, this.angle, this.speed);
    this.phase = "flying";
    this.attempts++;
    this.accumulator = 0;
    this.cancelClock?.();
    this.cancelClock = this.ports.clock.begin((seconds) => this.frame(seconds));
    this.notify();
    return true;
  }

  retry(): void {
    if (this.phase === "ready") return;
    this.stop();
    this.phase = "ready";
    this.ball = launch(this.current.source, this.angle, 0);
    this.notify();
  }

  restart(): void {
    this.stop();
    this.phase = "ready";
    this.attempts = 0;
    this.ball = launch(this.current.source, this.angle, 0);
    this.notify();
  }

  selectLevel(index: number): boolean {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > this.unlocked ||
      index >= this.stages.length
    )
      return false;
    this.index = index;
    this.restart();
    this.save();
    this.notify();
    return true;
  }

  next(): boolean {
    if (!this.snapshot.canContinue) return false;
    return this.selectLevel(this.index + 1);
  }

  suspend(): void {
    if (this.phase === "flying") this.retry();
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }

  private frame(seconds: number): void {
    if (this.phase !== "flying") return;
    this.accumulator += Number.isFinite(seconds)
      ? Math.max(0, Math.min(0.1, seconds))
      : 0;
    while (this.accumulator >= STEP && this.phase === "flying") {
      this.accumulator -= STEP;
      const result = advance(this.ball, this.current);
      this.ball = result.ball;
      if (result.hitGoal) this.finish();
      else if (result.expired) {
        this.stop();
        this.phase = "missed";
      }
    }
    this.notify();
  }

  private finish(): void {
    this.stop();
    this.phase = "solved";
    const id = this.current.id;
    const previous = this.best[id] ?? Number.POSITIVE_INFINITY;
    this.best[id] = Math.min(previous, this.attempts);
    this.unlocked = Math.max(
      this.unlocked,
      Math.min(this.stages.length - 1, this.index + 1),
    );
    this.save();
  }

  private stars(attempts: number): number {
    return attempts <= 1 ? 3 : attempts <= 3 ? 2 : 1;
  }

  private save(): void {
    const progress: Progress = {
      unlocked: this.unlocked,
      current: this.index,
      best: { ...this.best },
    };
    this.ports.store.write(progress);
  }

  private stop(): void {
    this.cancelClock?.();
    this.cancelClock = null;
    this.accumulator = 0;
  }

  private notify(): void {
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}

export { BALL_RADIUS };

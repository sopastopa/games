import { CHAPTERS } from "../domain/chapters";
import { createRun, jump, pause, start, step } from "../domain/rules";
import type { Progress, Run, View } from "../domain/types";
import type { Ports } from "./ports";

type Listener = (view: View) => void;

export function normalizeProgress(value: Progress | null): Progress {
  const empty: Progress = {
    unlocked: 0,
    selected: 0,
    finished: [],
    collected: {},
    promenade: false,
  };
  if (!value) return empty;
  const unlocked =
    Number.isInteger(value.unlocked) && value.unlocked >= 0
      ? Math.min(value.unlocked, CHAPTERS.length - 1)
      : 0;
  const selected =
    Number.isInteger(value.selected) &&
    value.selected >= 0 &&
    value.selected <= unlocked
      ? value.selected
      : 0;
  const finished = CHAPTERS.filter(
    (chapter) =>
      Array.isArray(value.finished) && value.finished.includes(chapter.id),
  ).map((chapter) => chapter.id);
  const collected: Record<string, number> = {};
  for (const chapter of CHAPTERS) {
    const count = value.collected?.[chapter.id];
    if (typeof count === "number" && Number.isInteger(count) && count >= 0)
      collected[chapter.id] = Math.min(count, chapter.sparks.length);
  }
  return {
    unlocked,
    selected,
    finished,
    collected,
    promenade: value.promenade === true,
  };
}

export class NuageController {
  private readonly listeners = new Set<Listener>();
  private progress: Progress;
  private run: Run;
  private cancelClock: (() => void) | null = null;
  private holding = false;
  private disposed = false;

  constructor(private readonly ports: Ports) {
    let saved: Progress | null = null;
    try {
      saved = ports.store.read();
    } catch {
      // Playing must survive unavailable browser storage.
    }
    this.progress = normalizeProgress(saved);
    this.run = createRun(CHAPTERS[this.progress.selected]!);
  }

  get state(): View {
    return {
      chapter: CHAPTERS[this.progress.selected]!,
      chapterIndex: this.progress.selected,
      run: this.run,
      progress: this.progress,
      finishedCount: this.progress.finished.length,
      canContinue:
        this.progress.selected < CHAPTERS.length - 1 &&
        this.progress.selected + 1 <= this.progress.unlocked,
    };
  }

  subscribe(listener: Listener): () => void {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(): void {
    if (this.disposed || !["ready", "paused"].includes(this.run.phase)) return;
    this.run = start(this.run);
    this.beginClock();
    this.emit();
  }

  action(): void {
    if (this.run.phase === "ready" || this.run.phase === "paused") {
      this.start();
      return;
    }
    const next = jump(this.run);
    if (next !== this.run) {
      this.run = next;
      this.emit();
    }
  }

  setHolding(holding: boolean): void {
    this.holding = holding;
  }

  togglePause(): void {
    if (this.disposed) return;
    if (this.run.phase === "running") {
      this.run = pause(this.run);
      this.stopClock();
      this.holding = false;
    } else if (this.run.phase === "paused") {
      this.start();
      return;
    }
    this.emit();
  }

  hide(): void {
    if (this.run.phase === "running") this.togglePause();
  }

  setPromenade(enabled: boolean): void {
    if (this.disposed) return;
    this.progress = { ...this.progress, promenade: enabled };
    this.persist();
    this.emit();
  }

  restart(): void {
    if (this.disposed) return;
    this.stopClock();
    this.holding = false;
    this.run = createRun(this.state.chapter);
    this.emit();
  }

  select(index: number): boolean {
    if (
      this.disposed ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > this.progress.unlocked ||
      index >= CHAPTERS.length
    )
      return false;
    this.stopClock();
    this.holding = false;
    this.progress = { ...this.progress, selected: index };
    this.run = createRun(CHAPTERS[index]!);
    this.persist();
    this.emit();
    return true;
  }

  next(): boolean {
    return this.select(this.progress.selected + 1);
  }

  dispose(): void {
    this.stopClock();
    this.holding = false;
    this.listeners.clear();
    this.disposed = true;
  }

  private beginClock(): void {
    this.stopClock();
    this.cancelClock = this.ports.clock.start((dt) => {
      if (this.run.phase !== "running" || this.disposed) return;
      const next = step(
        this.run,
        this.state.chapter,
        dt,
        this.holding,
        this.progress.promenade,
      );
      if (next === this.run) return;
      this.run = next;
      if (next.phase === "complete") {
        this.stopClock();
        this.finish();
      }
      this.emit();
    });
  }

  private stopClock(): void {
    const cancel = this.cancelClock;
    this.cancelClock = null;
    cancel?.();
  }

  private finish(): void {
    const chapter = this.state.chapter;
    const finished = this.progress.finished.includes(chapter.id)
      ? this.progress.finished
      : [...this.progress.finished, chapter.id];
    this.progress = {
      ...this.progress,
      unlocked: Math.max(
        this.progress.unlocked,
        Math.min(CHAPTERS.length - 1, this.progress.selected + 1),
      ),
      finished,
      collected: {
        ...this.progress.collected,
        [chapter.id]: Math.max(
          this.progress.collected[chapter.id] ?? 0,
          this.run.sparks.length,
        ),
      },
    };
    this.persist();
  }

  private persist(): void {
    try {
      this.ports.store.write(this.progress);
    } catch {
      // Storage does not interrupt a run.
    }
  }

  private emit(): void {
    const view = this.state;
    for (const listener of this.listeners) listener(view);
  }
}

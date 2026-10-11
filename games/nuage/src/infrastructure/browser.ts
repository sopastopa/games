import type { Clock, ProgressStore } from "../application/ports";
import type { Progress } from "../domain/types";
import { CHAPTERS } from "../domain/chapters";

const KEY = "games:nuage:progress-v1";

export const browserStore: ProgressStore = {
  read(): Progress | null {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const data = parsed as Record<string, unknown>;
      if (
        !Number.isInteger(data.unlocked) ||
        !Number.isInteger(data.selected) ||
        !Array.isArray(data.finished) ||
        !data.finished.every((id) => typeof id === "string") ||
        typeof data.promenade !== "boolean" ||
        !data.collected ||
        typeof data.collected !== "object" ||
        Array.isArray(data.collected)
      )
        return null;
      const collected: Record<string, number> = {};
      const candidate = data.collected as Record<string, unknown>;
      for (const chapter of CHAPTERS) {
        const count = candidate[chapter.id];
        if (typeof count === "number" && Number.isInteger(count) && count >= 0)
          collected[chapter.id] = count;
      }
      return {
        unlocked: data.unlocked as number,
        selected: data.selected as number,
        finished: data.finished as string[],
        collected,
        promenade: data.promenade,
      };
    } catch {
      return null;
    }
  },
  write(progress: Progress): void {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(progress));
    } catch {
      // Private browsing, quota exceeded or disabled storage.
    }
  },
};

export const animationClock: Clock = {
  start(callback) {
    let frame = 0;
    let last = 0;
    let active = true;
    const tick = (timestamp: number): void => {
      if (!active) return;
      if (last) callback(Math.min((timestamp - last) / 1000, 1 / 30));
      last = timestamp;
      if (active) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  },
};

import type { Clock, Progress, ProgressStore } from "../application/ports";

const key = "games:rebond:progress-v1";

export const progressStore: ProgressStore = {
  read(): Progress | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const unknown: unknown = JSON.parse(raw);
      if (!unknown || typeof unknown !== "object") return null;
      const object = unknown as Record<string, unknown>;
      if (!Number.isInteger(object.unlocked) || !Number.isInteger(object.current)) return null;
      if (!object.best || typeof object.best !== "object" || Array.isArray(object.best)) return null;
      const best: Record<string, number> = {};
      for (const [id, value] of Object.entries(object.best as Record<string, unknown>)) {
        if (Number.isSafeInteger(value) && (value as number) >= 1 && (value as number) <= 1000000) {
          best[id] = value as number;
        }
      }
      return { unlocked: object.unlocked as number, current: object.current as number, best };
    } catch {
      return null;
    }
  },
  write(progress: Progress): void {
    try { window.localStorage.setItem(key, JSON.stringify(progress)); }
    catch { /* Game always works without persistence. */ }
  },
};

export const frameClock: Clock = {
  begin(onFrame) {
    let last = performance.now();
    let frameId = 0;
    let active = true;
    const frame = (now: number): void => {
      if (!active) return;
      const delta = (now - last) / 1000;
      last = now;
      onFrame(delta);
      if (active) frameId = window.requestAnimationFrame(frame);
    };
    frameId = window.requestAnimationFrame(frame);
    return () => { active = false; window.cancelAnimationFrame(frameId); };
  },
};

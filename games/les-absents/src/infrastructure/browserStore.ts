import type { Progress, ProgressStore } from "../application/ports";

const key = "games:les-absents:progress-v1";

export const browserProgress: ProgressStore = {
  read(): Progress | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== "object") return null;
      const data = value as Record<string, unknown>;
      if (
        typeof data.unlocked !== "number" ||
        !Number.isFinite(data.unlocked) ||
        typeof data.current !== "number" ||
        !Number.isFinite(data.current) ||
        !Array.isArray(data.completed) ||
        !data.completed.every((item) => typeof item === "string")
      ) return null;
      return {
        unlocked: data.unlocked,
        current: data.current,
        completed: data.completed as string[],
      };
    } catch {
      return null;
    }
  },
  write(progress: Progress): void {
    try {
      localStorage.setItem(key, JSON.stringify(progress));
    } catch {
      // Private browsing can deny access; the game still works.
    }
  },
};

import type { Ports, Progress, ProgressStore, Scheduler } from "../application/ports";

const storageKey = "games:lisiere:progress-v1";

export const progressStore: ProgressStore = {
  read(): Progress | null {
    try {
      const text = localStorage.getItem(storageKey);
      if (!text) return null;
      const candidate: unknown = JSON.parse(text);
      if (!candidate || typeof candidate !== "object") return null;
      const value = candidate as Record<string, unknown>;
      if (
        !Number.isInteger(value.unlocked) ||
        !Number.isInteger(value.selected) ||
        !Array.isArray(value.wins) ||
        !value.wins.every((item) => typeof item === "string")
      ) return null;
      return {
        unlocked: value.unlocked as number,
        selected: value.selected as number,
        wins: value.wins as string[],
      };
    } catch {
      return null;
    }
  },
  write(progress: Progress): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Private browsing or disabled storage should never prevent playing.
    }
  },
};

export const scheduler: Scheduler = {
  schedule(callback, milliseconds) {
    const id = window.setTimeout(callback, milliseconds);
    return () => window.clearTimeout(id);
  },
};

export const browserPorts: Ports = { store: progressStore, scheduler };

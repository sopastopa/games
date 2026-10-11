import type { Progress, ProgressStore } from "../application/ports";
import { STAGES } from "../domain/levels";

const KEY = "games:torsion:progress-v1";

export const browserStore: ProgressStore = {
  read(): Progress | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== "object") return null;
      const data = value as Record<string, unknown>;
      if (
        !Number.isInteger(data.unlocked) ||
        !Number.isInteger(data.selected) ||
        !data.bests ||
        typeof data.bests !== "object" ||
        Array.isArray(data.bests)
      )
        return null;
      const bests: Record<string, number> = {};
      const original = data.bests as Record<string, unknown>;
      for (const stage of STAGES) {
        const amount = original[stage.id];
        if (
          typeof amount === "number" &&
          Number.isInteger(amount) &&
          amount > 0
        )
          bests[stage.id] = amount;
      }
      return {
        unlocked: data.unlocked as number,
        selected: data.selected as number,
        bests,
      };
    } catch {
      return null;
    }
  },
  write(progress: Progress): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
    } catch {
      // Disabled storage and private mode are supported.
    }
  },
};

import type { RecordData, RecordStore } from "../application/GameController";

const KEY = "games:prisme:record:v1";

export const browserRecord: RecordStore = {
  load(): unknown {
    try {
      const value = localStorage.getItem(KEY);
      return value === null ? null : (JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  },
  save(record: RecordData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(record));
    } catch {
      // Play remains possible without storage.
    }
  },
};

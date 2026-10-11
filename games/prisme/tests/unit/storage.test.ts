import { afterEach, describe, expect, it, vi } from "vitest";
import { browserRecord } from "../../src/infrastructure/browser";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser record adapter", () => {
  it("saves and restores a record under its own key", () => {
    const entries = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
    });
    const record = { bestZone: 2, bestScore: 200, lastSeed: 77 };
    browserRecord.save(record);
    expect(browserRecord.load()).toEqual(record);
    expect(entries.has("games:prisme:record:v1")).toBe(true);
  });

  it("survives blocked and corrupted storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{broken",
      setItem: () => {
        throw new Error("Storage unavailable");
      },
    });
    expect(browserRecord.load()).toBeNull();
    expect(() =>
      browserRecord.save({ bestZone: 1, bestScore: 0, lastSeed: 1 }),
    ).not.toThrow();
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Storage disabled");
      },
    });
    expect(browserRecord.load()).toBeNull();
  });
});

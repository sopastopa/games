import { afterEach, describe, expect, it, vi } from "vitest";
import { browserStore } from "../../src/infrastructure/browser";

afterEach(() => vi.unstubAllGlobals());

describe("NUAGE — local persistence", () => {
  it("stores and reads data scoped to NUAGE", () => {
    let raw = "";
    let key = "";
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => raw,
        setItem: (name: string, value: string) => {
          key = name;
          raw = value;
        },
      },
    });
    browserStore.write({
      selected: 1,
      unlocked: 1,
      finished: ["rose"],
      collected: { rose: 2 },
      promenade: true,
    });
    expect(key).toBe("games:nuage:progress-v1");
    expect(browserStore.read()).toEqual({
      selected: 1,
      unlocked: 1,
      finished: ["rose"],
      collected: { rose: 2 },
      promenade: true,
    });
  });

  it("ignores corrupt and unrelated storage fields", () => {
    let raw = "{";
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => raw,
        setItem: () => {
          throw new Error("Disabled");
        },
      },
    });
    expect(browserStore.read()).toBeNull();
    raw = JSON.stringify({
      selected: 0,
      unlocked: 1,
      finished: ["rose"],
      collected: { rose: 2, injected: 999 },
      promenade: false,
    });
    expect(browserStore.read()?.collected).toEqual({ rose: 2 });
    expect(() =>
      browserStore.write({
        selected: 0,
        unlocked: 0,
        finished: [],
        collected: {},
        promenade: false,
      }),
    ).not.toThrow();
  });
});

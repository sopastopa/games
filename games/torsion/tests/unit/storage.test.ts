import { afterEach, describe, expect, it, vi } from "vitest";
import { browserStore } from "../../src/infrastructure/browser";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TORSION — browser storage", () => {
  it("round-trips a valid save without including unrelated keys", () => {
    let saved = "";
    vi.stubGlobal("localStorage", {
      getItem: () => saved,
      setItem: (_key: string, value: string) => {
        saved = value;
      },
    });
    browserStore.write({
      unlocked: 1,
      selected: 1,
      bests: { etincelle: 1 },
    });
    expect(browserStore.read()).toEqual({
      unlocked: 1,
      selected: 1,
      bests: { etincelle: 1 },
    });
    saved = JSON.stringify({
      unlocked: 1,
      selected: 0,
      bests: { etincelle: 1, injected: 1 },
    });
    expect(browserStore.read()?.bests).toEqual({ etincelle: 1 });
  });

  it("rejects damaged data and unavailable storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{invalid",
      setItem: () => {
        throw new Error("disabled");
      },
    });
    expect(browserStore.read()).toBeNull();
    expect(() =>
      browserStore.write({ unlocked: 0, selected: 0, bests: {} }),
    ).not.toThrow();
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({ unlocked: 1, selected: "bad", bests: {} }),
    });
    expect(browserStore.read()).toBeNull();
  });
});

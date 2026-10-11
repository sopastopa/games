import { afterEach, describe, expect, it, vi } from "vitest";
import { browserCampaign } from "../../src/infrastructure/browser";
import { restoreCampaign } from "../../src/application/CampaignController";

afterEach(() => vi.unstubAllGlobals());

describe("browser progress adapter", () => {
  it("uses a game-isolated localStorage key and round-trips JSON", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    };
    vi.stubGlobal("localStorage", storage);
    const progress = restoreCampaign(null);
    browserCampaign.save(progress);
    expect([...values.keys()]).toEqual(["games:veille:campaign:v1"]);
    expect(browserCampaign.load()).toEqual(progress);
  });
  it("survives disabled storage and corrupt JSON", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{broken",
      setItem: () => { throw new Error("quota"); },
    });
    expect(browserCampaign.load()).toBeNull();
    expect(() => browserCampaign.save(restoreCampaign(null))).not.toThrow();
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("disabled"); },
      setItem: () => { throw new Error("disabled"); },
    });
    expect(browserCampaign.load()).toBeNull();
    expect(() => browserCampaign.save(restoreCampaign(null))).not.toThrow();
  });
});

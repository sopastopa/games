import { describe, expect, it, vi } from "vitest";
import { CampaignController, restoreCampaign, type CampaignStore } from "../../src/application/CampaignController";
import { shortestPath } from "../../src/domain/generation";
import { directionBetween } from "../../src/domain/rules";
import { EXIT, type Campaign } from "../../src/domain/types";

function setup(value: unknown = null) {
  let current = value;
  const save = vi.fn((data: Campaign) => { current = structuredClone(data); });
  const store: CampaignStore = { load: () => current, save };
  return { game: new CampaignController(store), save, getStored: () => current };
}

describe("campaign and persistence", () => {
  it("restores safely from missing and corrupt data", () => {
    expect(restoreCampaign(null).unlocked).toBe(0);
    expect(restoreCampaign({ unlocked: 99, completed: [-1, 0, 0, 12], discoveries: ["0:1", "0:1", "XSS"], run: { hacked: true } })).toMatchObject({
      unlocked: 1, completed: [0], discoveries: ["0:1"], run: null,
    });
  });

  it("only launches unlocked sectors with valid roles and seeds", () => {
    const { game } = setup();
    expect(game.launch(1, "scout")).toBe(false);
    expect(game.launch(0, "scout", -1)).toBe(false);
    expect(game.launch(0, "scout", 123)).toBe(true);
    expect(game.view.run!.seed).toBe(123);
  });

  it("persists moves, recovers on reload and preserves discoveries", () => {
    const { game, getStored, save } = setup();
    game.launch(0, "guardian", 17);
    const run = game.view.run!;
    const archive = run.terrain.indexOf("archive");
    const route = shortestPath(run.terrain, run.position, archive);
    for (const tile of route.slice(1)) {
      const direction = directionBetween(game.view.run!.position, tile)!;
      expect(game.act({ kind: "move", direction })).toBe(true);
    }
    expect(game.view.campaign.discoveries).toContain("0:1");
    const snapshot = structuredClone(game.view.run!);
    expect(new CampaignController({ load: getStored, save }).view.run).toEqual(snapshot);
    expect(save).toHaveBeenCalled();
    game.abandon();
    expect(game.view.run).toBeNull();
    expect(game.view.campaign.discoveries).toContain("0:1");
  });

  it("unlocks sector two only after a genuine extraction and saves the best turn count", () => {
    const { game } = setup();
    game.launch(0, "guardian", 17);
    const targets = game.view.run!.terrain.flatMap((tile, index) => tile === "core" ? [index] : []);
    targets.push(EXIT);
    for (const target of targets) {
      const route = shortestPath(game.view.run!.terrain, game.view.run!.position, target);
      for (const tile of route.slice(1)) {
        const direction = directionBetween(game.view.run!.position, tile)!;
        game.act({ kind: "move", direction });
      }
    }
    expect(game.view.run!.phase).toBe("won");
    expect(game.view.campaign.unlocked).toBe(1);
    expect(game.view.campaign.completed).toContain(0);
    expect(game.view.campaign.bestTurns["0"]).toBe(game.view.run!.turn);
    game.next();
    expect(game.view.run!.sector).toBe(1);
  });

  it("unsubscribes views and cleans up without leaking subscribers", () => {
    const { game } = setup();
    const observer = vi.fn();
    const stop = game.subscribe(observer);
    expect(observer).toHaveBeenCalledTimes(1);
    stop();
    game.launch(0, "guardian");
    expect(observer).toHaveBeenCalledTimes(1);
    game.dispose();
  });
});

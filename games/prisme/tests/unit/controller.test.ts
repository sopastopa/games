import { describe, expect, it, vi } from "vitest";
import {
  GameController,
  restoreRecord,
} from "../../src/application/GameController";
import { IDLE } from "../../src/domain/rules";

describe("game controller and progression", () => {
  it("restores only valid storage data", () => {
    expect(restoreRecord(null).lastSeed).toBe(48271);
    expect(
      restoreRecord({
        bestZone: 500,
        bestScore: -7,
        lastSeed: "bad",
      }),
    ).toEqual({ bestZone: 1, bestScore: 0, lastSeed: 48271 });
    expect(
      restoreRecord({ bestZone: 3, bestScore: 570, lastSeed: 12 }),
    ).toEqual({ bestZone: 3, bestScore: 570, lastSeed: 12 });
  });

  it("validates starts, pause/resume, replay and observers", () => {
    const save = vi.fn();
    const controller = new GameController({ load: () => null, save });
    const listener = vi.fn();
    const detach = controller.subscribe(listener);
    expect(controller.start(0)).toBe(false);
    expect(controller.start(733)).toBe(true);
    expect(controller.state.phase).toBe("playing");
    expect(save).toHaveBeenCalled();
    controller.tick(IDLE);
    expect(controller.state.tick).toBe(1);
    controller.togglePause();
    expect(controller.state.phase).toBe("paused");
    controller.tick(IDLE);
    expect(controller.state.tick).toBe(1);
    controller.togglePause();
    controller.restart();
    expect(controller.state.seed).toBe(733);
    expect(controller.state.tick).toBe(0);
    expect(controller.nextZone()).toBe(false);
    detach();
    const count = listener.mock.calls.length;
    controller.pause();
    expect(listener).toHaveBeenCalledTimes(count);
    controller.dispose();
  });

  it("unlocks the next arena only after real extraction", () => {
    let saved: unknown = null;
    const store = {
      load: () => saved,
      save: (record: unknown) => {
        saved = record;
      },
    };
    const controller = new GameController(store);
    controller.start(17);
    const state = controller.state;
    state.enemies = [];
    state.relays = state.relays.map((relay) => ({ ...relay, charge: 100 }));
    state.player.x = state.arena.exit.x;
    state.player.y = state.arena.exit.y;
    controller.tick(IDLE);
    expect(controller.state.phase).toBe("cleared");
    expect(controller.best.bestScore).toBeGreaterThan(0);
    expect(controller.nextZone()).toBe(true);
    expect(controller.state.zone).toBe(2);
    expect(controller.state.phase).toBe("playing");
    expect(controller.state.seed).toBe(17);
    expect(new GameController(store).best.bestScore).toBeGreaterThan(0);
  });
});

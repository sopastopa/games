import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../../src/domain/chapters";
import {
  WORLD,
  createRun,
  jump,
  narrative,
  pause,
  start,
  step,
  validateChapter,
} from "../../src/domain/rules";

describe("NUAGE — simulation pure", () => {
  const chapter = CHAPTERS[0]!;

  it("starts on solid ground and does not advance before departure", () => {
    const ready = createRun(chapter);
    expect(ready.phase).toBe("ready");
    expect(ready.y).toBe(WORLD.ground - WORLD.radius);
    expect(step(ready, chapter, 1, false, false)).toBe(ready);
    expect(jump(ready)).toBe(ready);
    expect(start(ready).phase).toBe("running");
  });

  it("jumps once per landing, and falls back to the floor", () => {
    let run = jump(start(createRun(chapter)));
    expect(run.grounded).toBe(false);
    expect(run.vy).toBeLessThan(0);
    expect(jump(run)).toBe(run);
    for (let i = 0; i < 110; i++) {
      run = step(run, chapter, 1 / 60, false, true);
    }
    expect(run.grounded).toBe(true);
    expect(run.y).toBe(WORLD.ground - WORLD.radius);
  });

  it("holding in the air slows descent with finite glide energy", () => {
    const airborne = {
      ...start(createRun(chapter)),
      grounded: false,
      y: 270,
      vy: 140,
    };
    const gliding = step(airborne, chapter, 1 / 30, true, true);
    const falling = step(airborne, chapter, 1 / 30, false, true);
    expect(gliding.vy).toBeLessThan(falling.vy);
    expect(gliding.y).toBeLessThan(falling.y);
    expect(gliding.glide).toBeLessThan(airborne.glide);
    const empty = step({ ...airborne, glide: 0 }, chapter, 1 / 30, true, true);
    expect(empty.vy).toBe(falling.vy);
  });

  it("limits time jumps and rejects invalid frame deltas", () => {
    const run = start(createRun(chapter));
    expect(step(run, chapter, -4, false, true)).toBe(run);
    expect(step(run, chapter, Number.NaN, false, true)).toBe(run);
    expect(step(run, chapter, 8, false, true).x - run.x).toBeCloseTo(
      WORLD.speed / 30,
    );
  });

  it("hitting an obstacle respawns with no limit on retries", () => {
    let run = start(createRun(chapter));
    for (let i = 0; i < 300; i++) {
      run = step(run, chapter, 1 / 60, false, false);
      if (run.tries > 0) break;
    }
    expect(run.tries).toBe(1);
    expect(run.x).toBe(80);
    expect(run.phase).toBe("running");
  });

  it("a timed jump crosses the first ink puddle", () => {
    let run = start({ ...createRun(chapter), x: 425 });
    run = jump(run);
    for (let i = 0; i < 45; i++) {
      run = step(run, chapter, 1 / 60, true, false);
    }
    expect(run.x).toBeGreaterThan(578);
    expect(run.tries).toBe(0);
  });

  it("activates checkpoint and shows the middle of the story", () => {
    const run = start({ ...createRun(chapter), x: chapter.checkpoint - 2 });
    const next = step(run, chapter, 1 / 30, false, true);
    expect(next.checkpoint).toBe(chapter.checkpoint);
    expect(next.beat).toBe("middle");
    expect(narrative(next, chapter)).toBe(chapter.middle);
  });

  it("collects optional light memories without requiring them for victory", () => {
    const spot = chapter.sparks[0]!;
    const run = start({ ...createRun(chapter), x: spot.x - 5, y: spot.y });
    const collected = step(run, chapter, 1 / 60, false, true);
    expect(collected.sparks).toEqual([0]);
    expect(step(collected, chapter, 1 / 60, false, true).sparks).toEqual([0]);
    const nearEnd = start({
      ...createRun(chapter),
      x: chapter.endX - 1,
    });
    const completed = step(nearEnd, chapter, 1 / 60, false, true);
    expect(completed.phase).toBe("complete");
    expect(completed.beat).toBe("ending");
    expect(completed.sparks.length).toBe(0);
    expect(narrative(completed, chapter)).toBe(chapter.ending);
  });

  it("can pause without progressing while inactive", () => {
    const run = pause(start(createRun(chapter)));
    expect(run.phase).toBe("paused");
    expect(step(run, chapter, 1 / 30, true, false)).toBe(run);
    expect(start(run).phase).toBe("running");
  });

  it.each(CHAPTERS)(
    "chapter $id is valid and finishable in promenade mode",
    (scene) => {
      validateChapter(scene);
      let run = start(createRun(scene));
      for (let i = 0; i < 450 && run.phase !== "complete"; i++) {
        run = step(run, scene, 1 / 30, false, true);
      }
      expect(run.phase).toBe("complete");
      expect(run.tries).toBe(0);
      expect(narrative(run, scene)).toBe(scene.ending);
      expect(scene.opening.length).toBeGreaterThan(35);
      expect(scene.middle.length).toBeGreaterThan(35);
      expect(scene.ending.length).toBeGreaterThan(35);
    },
  );

  it("rejects malformed levels and blocked checkpoint positions", () => {
    expect(() =>
      validateChapter({ ...chapter, checkpoint: chapter.endX }),
    ).toThrow("Invalid chapter");
    expect(() =>
      validateChapter({
        ...chapter,
        obstacles: [{ kind: "ink", x: chapter.checkpoint - 10, width: 40 }],
      }),
    ).toThrow("Invalid obstacle");
    expect(() =>
      validateChapter({ ...chapter, sparks: [{ x: -20, y: 300 }] }),
    ).toThrow("Invalid spark");
  });
});

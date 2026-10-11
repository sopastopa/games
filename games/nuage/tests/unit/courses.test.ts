import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../../src/domain/chapters";
import {
  createRun,
  jump,
  orbY,
  start,
  step,
  validateChapter,
  WORLD,
} from "../../src/domain/rules";

type Guide = Readonly<{
  jumps: readonly number[];
  holdBlocks: readonly number[];
}>;

// Deterministic, zero-collision playthroughs (frame input at 30 Hz).
// Unlike a disabled-collision walkthrough, these use the real rules and
// all seven authored courses, including gaps, suspended obstacles and orbs.
const GUIDES: readonly Guide[] = [
  { jumps: [45, 120], holdBlocks: [] },
  { jumps: [33, 75, 126, 165], holdBlocks: [51, 90, 93, 96, 180, 183, 186] },
  { jumps: [30, 93, 129, 192], holdBlocks: [] },
  { jumps: [24, 87, 132, 156, 204], holdBlocks: [42, 147, 150] },
  { jumps: [21, 66, 144, 198], holdBlocks: [81, 162, 201, 216, 219] },
  { jumps: [18, 108, 147, 168, 219], holdBlocks: [162, 165] },
  {
    jumps: [18, 78, 99, 135, 186, 288],
    holdBlocks: [93, 96, 195, 201, 204, 207],
  },
];

describe("NUAGE — campagne de difficulté", () => {
  it("introduces new concepts chapter by chapter", () => {
    expect(CHAPTERS).toHaveLength(7);
    const hazards = CHAPTERS.map(
      (chapter) => new Set(chapter.obstacles.map((item) => item.kind)),
    );
    expect([...hazards[0]!]).toEqual(["ink"]);
    expect(hazards[1]!.has("gap")).toBe(true);
    expect(hazards[2]!.has("arch")).toBe(true);
    expect(CHAPTERS[3]!.airJump).toBe(true);
    expect(CHAPTERS[4]!.winds.length).toBeGreaterThan(0);
    expect(hazards[5]!.has("orb")).toBe(true);
    expect(CHAPTERS[6]!.speed).toBeGreaterThan(CHAPTERS[0]!.speed);
    expect(CHAPTERS.every((chapter) => chapter.lesson && chapter.concept)).toBe(
      true,
    );
  });

  it.each(CHAPTERS.map((chapter, index) => ({ chapter, index })))(
    "can complete $chapter.id without taking a hit in standard mode",
    ({ chapter, index }) => {
      validateChapter(chapter);
      const guide = GUIDES[index]!;
      const jumps = new Set(guide.jumps);
      const holds = new Set(guide.holdBlocks);
      let run = start(createRun(chapter));
      let usedAirJump = false;
      let usedWind = false;
      for (let frame = 0; frame < 370 && run.phase !== "complete"; frame++) {
        if (jumps.has(frame)) {
          const before = run.airJumps;
          run = jump(run);
          if (run.airJumps < before) usedAirJump = true;
        }
        const holding = holds.has(Math.floor(frame / 3) * 3);
        if (
          holding &&
          chapter.winds.some(
            (wind) => run.x >= wind.x && run.x <= wind.x + wind.width,
          )
        )
          usedWind = true;
        run = step(run, chapter, 1 / 30, holding, false);
        expect(run.tries).toBe(0);
      }
      expect(run.phase).toBe("complete");
      expect(run.x).toBe(chapter.endX);
      expect(run.beat).toBe("ending");
      if (index === 3 || index === 5 || index === 6)
        expect(usedAirJump).toBe(true);
      if (index === 4 || index === 6) expect(usedWind).toBe(true);
    },
  );

  it("does not complete the first course by doing nothing", () => {
    const chapter = CHAPTERS[0]!;
    let run = start(createRun(chapter));
    for (let frame = 0; frame < 110; frame++)
      run = step(run, chapter, 1 / 30, false, false);
    expect(run.phase).toBe("running");
    expect(run.tries).toBeGreaterThan(0);
    expect(run.lastHit).toBe("ink");
  });

  it("traverses a ledge with a forgiving coyote jump", () => {
    const chapter = CHAPTERS[1]!;
    const gap = chapter.obstacles.find((o) => o.kind === "gap")!;
    const edge = start({ ...createRun(chapter), x: gap.x - 3 });
    const off = step(edge, chapter, 1 / 30, false, false);
    expect(off.grounded).toBe(false);
    expect(off.grace).toBeGreaterThan(0);
    expect(jump(off).vy).toBe(WORLD.jumpSpeed);
  });

  it("lets the player use one additional airborne jump, not an unlimited number", () => {
    const chapter = CHAPTERS[3]!;
    let run = start(createRun(chapter));
    run = jump(run);
    expect(run.airJumps).toBe(1);
    run = step(run, chapter, 1 / 30, false, false);
    run = jump(run);
    expect(run.vy).toBe(WORLD.jumpSpeed);
    expect(run.airJumps).toBe(0);
    expect(jump(run)).toBe(run);
  });

  it("gusts only lift while the player holds the glide control", () => {
    const chapter = CHAPTERS[4]!;
    const wind = chapter.winds[0]!;
    const run = start({
      ...createRun(chapter),
      x: wind.x + 20,
      y: 280,
      grounded: false,
      vy: 150,
    });
    const lifted = step(run, chapter, 1 / 30, true, false);
    const falling = step(run, chapter, 1 / 30, false, false);
    expect(lifted.vy).toBeLessThan(falling.vy);
    expect(lifted.y).toBeLessThan(falling.y);
  });

  it("uses a deterministic moving orb hitbox, synchronized with the visual animation", () => {
    const chapter = CHAPTERS[5]!;
    const orb = chapter.obstacles.find((o) => o.kind === "orb")!;
    const run = start({
      ...createRun(chapter),
      x: orb.x + orb.width / 2 - chapter.speed / 30,
      y: orbY(orb, 1 / 30),
      grounded: false,
      vy: 0,
    });
    const hit = step(run, chapter, 1 / 30, false, false);
    expect(hit.lastHit).toBe("orb");
    expect(hit.tries).toBe(1);
    const safe = step(run, chapter, 1 / 30, false, true);
    expect(safe.tries).toBe(0);
  });

  it("reports an aerial arch collision and allows passing beneath it", () => {
    const chapter = CHAPTERS[2]!;
    const arch = chapter.obstacles.find((o) => o.kind === "arch")!;
    const flying = start({
      ...createRun(chapter),
      x: arch.x - chapter.speed / 30,
      y: 320,
      grounded: false,
      vy: 0,
    });
    expect(step(flying, chapter, 1 / 30, false, false).lastHit).toBe("arch");
    const grounded = start({
      ...createRun(chapter),
      x: arch.x - chapter.speed / 30,
    });
    const safe = step(grounded, chapter, 1 / 30, false, false);
    expect(safe.tries).toBe(0);
  });
});

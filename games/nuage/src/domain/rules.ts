import type { Chapter, Obstacle, Run } from "./types";

export const WORLD = {
  width: 960,
  height: 540,
  ground: 422,
  radius: 20,
  speed: 232,
  jumpSpeed: -555,
  gravity: 1260,
  glideGravity: 360,
  glideSeconds: 0.75,
  obstacleHeight: 37,
} as const;

export function orbY(obstacle: Obstacle, elapsed: number): number {
  return (
    (obstacle.centerY ?? 340) +
    Math.sin(elapsed * (obstacle.frequency ?? 3) + (obstacle.phase ?? 0)) *
      (obstacle.amplitude ?? 0)
  );
}

export function validateChapter(chapter: Chapter): void {
  if (
    !chapter.id ||
    !Number.isFinite(chapter.endX) ||
    chapter.endX <= 400 ||
    !Number.isFinite(chapter.checkpoint) ||
    chapter.checkpoint <= 100 ||
    chapter.checkpoint >= chapter.endX ||
    !Number.isFinite(chapter.speed) ||
    chapter.speed < 150 ||
    chapter.speed > 360
  )
    throw new Error("Invalid chapter: " + chapter.id);
  let previousEnd = 160;
  for (const obstacle of chapter.obstacles) {
    if (
      !Number.isFinite(obstacle.x) ||
      !Number.isFinite(obstacle.width) ||
      obstacle.width <= 0 ||
      obstacle.x <= previousEnd + 25 ||
      obstacle.x + obstacle.width >= chapter.endX - 60 ||
      Math.abs(chapter.checkpoint - obstacle.x) < WORLD.radius + 30 ||
      (chapter.checkpoint >= obstacle.x &&
        chapter.checkpoint <= obstacle.x + obstacle.width + WORLD.radius + 30) ||
      (obstacle.kind === "arch" &&
        (!Number.isFinite(obstacle.bottom) ||
          (obstacle.bottom ?? 0) < 310 ||
          (obstacle.bottom ?? 0) >= WORLD.ground - WORLD.radius)) ||
      (obstacle.kind === "orb" &&
        (!Number.isFinite(obstacle.centerY) ||
          !Number.isFinite(obstacle.amplitude) ||
          !Number.isFinite(obstacle.frequency) ||
          (obstacle.amplitude ?? 0) < 0 ||
          (obstacle.frequency ?? 0) <= 0))
    )
      throw new Error("Invalid obstacle: " + chapter.id);
    previousEnd = obstacle.x + obstacle.width;
  }
  for (const wind of chapter.winds) {
    if (
      !Number.isFinite(wind.x) ||
      !Number.isFinite(wind.width) ||
      !Number.isFinite(wind.lift) ||
      wind.x < 100 ||
      wind.x + wind.width >= chapter.endX ||
      wind.width <= 0 ||
      wind.lift < 100 ||
      wind.lift > 1500
    )
      throw new Error("Invalid wind: " + chapter.id);
  }
  for (const spark of chapter.sparks) {
    if (
      !Number.isFinite(spark.x) ||
      !Number.isFinite(spark.y) ||
      spark.x < 80 ||
      spark.x > chapter.endX ||
      spark.y < 100 ||
      spark.y >= WORLD.ground
    )
      throw new Error("Invalid spark: " + chapter.id);
  }
}

export function createRun(chapter: Chapter): Run {
  validateChapter(chapter);
  return {
    phase: "ready",
    x: 80,
    y: WORLD.ground - WORLD.radius,
    vy: 0,
    grounded: true,
    grace: 0,
    airJumps: chapter.airJump ? 1 : 0,
    elapsed: 0,
    glide: WORLD.glideSeconds,
    checkpoint: 80,
    tries: 0,
    lastHit: null,
    sparks: [],
    beat: "opening",
  };
}

export function start(run: Run): Run {
  return run.phase === "ready" || run.phase === "paused"
    ? { ...run, phase: "running" }
    : run;
}

export function pause(run: Run): Run {
  return run.phase === "running" ? { ...run, phase: "paused" } : run;
}

export function jump(run: Run): Run {
  if (
    run.phase !== "running" ||
    (!run.grounded && run.grace <= 0 && run.airJumps <= 0)
  )
    return run;
  const usingSecondJump = !run.grounded && run.grace <= 0;
  return {
    ...run,
    grounded: false,
    grace: 0,
    airJumps: run.airJumps - (usingSecondJump ? 1 : 0),
    vy: WORLD.jumpSpeed,
    glide: WORLD.glideSeconds,
  };
}

function overGap(x: number, chapter: Chapter): boolean {
  return chapter.obstacles.some(
    (obstacle) =>
      obstacle.kind === "gap" &&
      x >= obstacle.x &&
      x <= obstacle.x + obstacle.width,
  );
}

function touchesObstacle(
  x: number,
  y: number,
  elapsed: number,
  obstacle: Obstacle,
): boolean {
  if (obstacle.kind === "gap") return false;
  if (obstacle.kind === "orb") {
    const orbX = obstacle.x + obstacle.width / 2;
    return (
      Math.hypot(x - orbX, y - orbY(obstacle, elapsed)) <
      WORLD.radius + obstacle.width * 0.45
    );
  }
  const overlapsX =
    x + WORLD.radius > obstacle.x &&
    x - WORLD.radius < obstacle.x + obstacle.width;
  if (!overlapsX) return false;
  if (obstacle.kind === "arch")
    return y - WORLD.radius < (obstacle.bottom ?? 350) && y + WORLD.radius > 155;
  return y + WORLD.radius > WORLD.ground - WORLD.obstacleHeight;
}

function respawn(
  run: Run,
  chapter: Chapter,
  elapsed: number,
  checkpoint: number,
  beat: Run["beat"],
  sparks: readonly number[],
  lastHit: Obstacle["kind"],
): Run {
  return {
    ...run,
    x: checkpoint,
    y: WORLD.ground - WORLD.radius,
    vy: 0,
    grounded: true,
    grace: 0,
    airJumps: chapter.airJump ? 1 : 0,
    glide: WORLD.glideSeconds,
    elapsed,
    checkpoint,
    beat,
    sparks,
    tries: run.tries + 1,
    lastHit,
  };
}

export function step(
  run: Run,
  chapter: Chapter,
  elapsedSeconds: number,
  holding: boolean,
  promenade: boolean,
): Run {
  if (run.phase !== "running") return run;
  const dt = Number.isFinite(elapsedSeconds)
    ? Math.min(1 / 30, Math.max(0, elapsedSeconds))
    : 0;
  if (!dt) return run;

  const x = Math.min(chapter.endX, run.x + chapter.speed * dt);
  const elapsed = run.elapsed + dt;
  const gap = !promenade && overGap(x, chapter);
  let { vy, y, glide, grounded, grace, airJumps } = run;

  if (grounded && gap) {
    grounded = false;
    grace = 0.1;
  }
  if (!grounded) {
    const gliding = holding && glide > 0 && vy >= 0;
    const currentLift =
      holding && glide > 0
        ? chapter.winds.find((wind) => x >= wind.x && x <= wind.x + wind.width)
            ?.lift ?? 0
        : 0;
    const gravity = gliding ? WORLD.glideGravity : WORLD.gravity;
    vy = Math.max(-680, Math.min(830, vy + (gravity - currentLift) * dt));
    y += vy * dt;
    if (gliding || currentLift > 0) glide = Math.max(0, glide - dt);
    grace = Math.max(0, grace - dt);
    if (y >= WORLD.ground - WORLD.radius && !gap) {
      y = WORLD.ground - WORLD.radius;
      vy = 0;
      grounded = true;
      grace = 0;
      airJumps = chapter.airJump ? 1 : 0;
      glide = WORLD.glideSeconds;
    }
  }
  const checkpoint =
    x >= chapter.checkpoint ? chapter.checkpoint : run.checkpoint;
  const beat = x >= chapter.checkpoint ? "middle" : run.beat;
  const sparks = [...run.sparks];
  chapter.sparks.forEach((spark, index) => {
    if (!sparks.includes(index) && Math.hypot(x - spark.x, y - spark.y) < 43)
      sparks.push(index);
  });

  const collision = !promenade
    ? chapter.obstacles.find((obstacle) =>
        touchesObstacle(x, y, elapsed, obstacle),
      )
    : undefined;
  if (!promenade && (y > WORLD.ground + 43 || collision)) {
    return respawn(
      run, chapter, elapsed, checkpoint, beat, sparks,
      collision?.kind ?? "gap",
    );
  }

  return {
    ...run,
    phase: x >= chapter.endX ? "complete" : "running",
    x,
    y,
    vy,
    glide,
    grounded,
    grace,
    airJumps,
    elapsed,
    checkpoint,
    beat: x >= chapter.endX ? "ending" : beat,
    sparks,
  };
}

export function narrative(run: Run, chapter: Chapter): string {
  if (run.beat === "ending") return chapter.ending;
  if (run.beat === "middle") return chapter.middle;
  return chapter.opening;
}

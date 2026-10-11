import type { Chapter, Run } from "./types";

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

export function validateChapter(chapter: Chapter): void {
  if (
    !chapter.id ||
    !Number.isFinite(chapter.endX) ||
    chapter.endX <= 400 ||
    !Number.isFinite(chapter.checkpoint) ||
    chapter.checkpoint <= 100 ||
    chapter.checkpoint >= chapter.endX
  )
    throw new Error("Invalid chapter: " + chapter.id);
  for (const obstacle of chapter.obstacles) {
    if (
      !Number.isFinite(obstacle.x) ||
      !Number.isFinite(obstacle.width) ||
      obstacle.width <= 0 ||
      obstacle.x <= 160 ||
      obstacle.x + obstacle.width >= chapter.endX ||
      (obstacle.x <= chapter.checkpoint &&
        obstacle.x + obstacle.width >= chapter.checkpoint - 25)
    )
      throw new Error("Invalid obstacle: " + chapter.id);
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
    glide: WORLD.glideSeconds,
    checkpoint: 80,
    tries: 0,
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
  if (run.phase !== "running" || !run.grounded) return run;
  return {
    ...run,
    grounded: false,
    vy: WORLD.jumpSpeed,
    glide: WORLD.glideSeconds,
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
  const x = Math.min(chapter.endX, run.x + WORLD.speed * dt);
  let vy = run.vy;
  let y = run.y;
  let glide = run.glide;
  let grounded = run.grounded;
  if (!grounded) {
    const gliding = holding && vy > 0 && glide > 0;
    const gravity = gliding ? WORLD.glideGravity : WORLD.gravity;
    vy = Math.min(830, vy + gravity * dt);
    y += vy * dt;
    if (gliding) glide = Math.max(0, glide - dt);
    if (y >= WORLD.ground - WORLD.radius) {
      y = WORLD.ground - WORLD.radius;
      vy = 0;
      grounded = true;
      glide = WORLD.glideSeconds;
    }
  }
  const checkpoint = x >= chapter.checkpoint ? chapter.checkpoint : run.checkpoint;
  const beat = x >= chapter.checkpoint ? "middle" : run.beat;
  const sparks = [...run.sparks];
  chapter.sparks.forEach((spark, index) => {
    if (
      !sparks.includes(index) &&
      Math.hypot(x - spark.x, y - spark.y) < 43
    )
      sparks.push(index);
  });
  if (!promenade && chapter.obstacles.some((obstacle) =>
    x + WORLD.radius > obstacle.x &&
    x - WORLD.radius < obstacle.x + obstacle.width &&
    y + WORLD.radius > WORLD.ground - WORLD.obstacleHeight
  )) {
    return {
      ...run,
      x: checkpoint,
      y: WORLD.ground - WORLD.radius,
      vy: 0,
      grounded: true,
      glide: WORLD.glideSeconds,
      checkpoint,
      beat,
      sparks,
      tries: run.tries + 1,
    };
  }
  return {
    ...run,
    phase: x >= chapter.endX ? "complete" : "running",
    x,
    y,
    vy,
    glide,
    grounded,
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

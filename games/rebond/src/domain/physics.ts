import type { Ball, Bumper, Level, Motion, Vec2 } from "./types";

export const WORLD = { width: 900, height: 600, margin: 35, floor: 562 } as const;
export const BALL_RADIUS = 11;
export const STEP = 1 / 120;
export const GRAVITY = 520;
export const MAX_FLIGHT = 6.5;

export function launch(source: Vec2, angleDegrees: number, speed: number): Ball {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: source.x,
    y: source.y,
    vx: Math.cos(angle) * speed,
    vy: -Math.sin(angle) * speed,
    elapsed: 0,
  };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function step(ball: Ball, bumpers: readonly Bumper[], dt = STEP): Ball {
  const elapsed = Number.isFinite(dt) && dt > 0 ? Math.min(STEP, dt) : 0;
  if (!elapsed) return ball;
  let { x, y, vx, vy } = ball;
  vy += GRAVITY * elapsed;
  x += vx * elapsed;
  y += vy * elapsed;
  const minX = WORLD.margin + BALL_RADIUS;
  const maxX = WORLD.width - WORLD.margin - BALL_RADIUS;
  const minY = WORLD.margin + BALL_RADIUS;
  const maxY = WORLD.floor - BALL_RADIUS;

  if (x < minX) { x = minX; vx = Math.abs(vx) * 0.83; }
  if (x > maxX) { x = maxX; vx = -Math.abs(vx) * 0.83; }
  if (y < minY) { y = minY; vy = Math.abs(vy) * 0.83; }
  if (y > maxY) { y = maxY; vy = -Math.abs(vy) * 0.77; vx *= 0.988; }

  for (const bumper of bumpers) {
    let dx = x - bumper.x;
    let dy = y - bumper.y;
    let separation = Math.hypot(dx, dy);
    const required = BALL_RADIUS + bumper.radius;
    if (separation >= required) continue;
    if (separation < 0.000001) { dx = 0; dy = -1; separation = 1; }
    const nx = dx / separation;
    const ny = dy / separation;
    x = bumper.x + nx * required;
    y = bumper.y + ny * required;
    const towards = vx * nx + vy * ny;
    if (towards < 0) {
      vx -= 1.88 * towards * nx;
      vy -= 1.88 * towards * ny;
    }
  }
  return { x, y, vx, vy, elapsed: ball.elapsed + elapsed };
}

export function advance(ball: Ball, level: Level, dt = STEP): Motion {
  const next = step(ball, level.bumpers, dt);
  return {
    ball: next,
    hitGoal: distance(next, level.goal) <= level.goalRadius + BALL_RADIUS,
    expired: next.elapsed >= MAX_FLIGHT,
  };
}

export function project(
  source: Vec2,
  angle: number,
  speed: number,
  bumpers: readonly Bumper[],
  seconds: number,
): Ball {
  let ball = launch(source, angle, speed);
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) ball = step(ball, bumpers);
  return ball;
}

export function estimateTrajectory(level: Level, angle: number, speed: number, seconds = 0.75): Vec2[] {
  const points: Vec2[] = [];
  let ball = launch(level.source, angle, speed);
  const count = Math.round(seconds / STEP);
  for (let i = 0; i < count; i++) {
    ball = step(ball, level.bumpers);
    if (i % 4 === 0) points.push({ x: ball.x, y: ball.y });
  }
  return points;
}

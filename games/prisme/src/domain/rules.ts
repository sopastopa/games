import {
  generateArena,
  hasSight,
  MAX_ZONE,
  nextStep,
  passable,
  type Arena,
  type Point,
} from "./map";

export type Phase = "ready" | "playing" | "paused" | "cleared" | "won" | "lost";

export interface Pilot extends Point {
  hp: number;
  heat: number;
  cooldown: number;
  dashCooldown: number;
  dashTime: number;
  invulnerable: number;
}

export interface Sentinel extends Point {
  id: number;
  hp: number;
  timer: number;
}

export interface Shot extends Point {
  dx: number;
  dy: number;
  hostile: boolean;
  life: number;
}

export interface Relay extends Point {
  charge: number;
}

export interface GameState {
  seed: number;
  zone: number;
  arena: Arena;
  phase: Phase;
  tick: number;
  score: number;
  player: Pilot;
  enemies: Sentinel[];
  shots: Shot[];
  relays: Relay[];
}

export interface Controls {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  shoot: boolean;
  dash: boolean;
}

export const IDLE: Controls = {
  moveX: 0,
  moveY: 0,
  aimX: 1,
  aimY: 0,
  shoot: false,
  dash: false,
};

export function createGame(seed: number, zone = 1): GameState {
  const arena = generateArena(seed, zone);
  return {
    seed,
    zone,
    arena,
    phase: "ready",
    tick: 0,
    score: 0,
    player: {
      x: 6,
      y: 6,
      hp: 6,
      heat: 0,
      cooldown: 0,
      dashCooldown: 0,
      dashTime: 0,
      invulnerable: 0,
    },
    enemies: arena.spawns.map((point, id) => ({
      ...point,
      id,
      hp: zone >= 3 ? 3 : 2,
      timer: 65 + id * 17,
    })),
    shots: [],
    relays: arena.relays.map((point) => ({ ...point, charge: 0 })),
  };
}

export function distance(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function unit(x: number, y: number): Point {
  const length = Math.hypot(x, y);
  if (length < 0.001) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

function canOccupy(arena: Arena, x: number, y: number): boolean {
  const radius = 0.22;
  return (
    passable(arena, Math.round(x - radius), Math.round(y - radius)) &&
    passable(arena, Math.round(x + radius), Math.round(y - radius)) &&
    passable(arena, Math.round(x - radius), Math.round(y + radius)) &&
    passable(arena, Math.round(x + radius), Math.round(y + radius))
  );
}

function move(arena: Arena, point: Point, dx: number, dy: number): void {
  if (canOccupy(arena, point.x + dx, point.y)) point.x += dx;
  if (canOccupy(arena, point.x, point.y + dy)) point.y += dy;
}

export function bestAim(state: GameState): Point {
  const candidates = [...state.enemies].sort(
    (first, second) =>
      distance(first, state.player) - distance(second, state.player),
  );
  const target =
    candidates.find((enemy) => hasSight(state.arena, state.player, enemy)) ??
    candidates[0];
  return target
    ? unit(target.x - state.player.x, target.y - state.player.y)
    : { x: 1, y: 0 };
}

export function objectiveReady(state: GameState): boolean {
  return (
    state.enemies.length === 0 &&
    state.relays.every((relay) => relay.charge >= 100)
  );
}

export function stepGame(state: GameState, input: Controls): GameState {
  if (state.phase !== "playing") return state;
  const player = { ...state.player };
  const enemies = state.enemies.map((enemy) => ({ ...enemy }));
  const relays = state.relays.map((relay) => ({ ...relay }));
  const shots: Shot[] = [];
  const next: GameState = {
    ...state,
    tick: state.tick + 1,
    player,
    enemies,
    relays,
    shots,
  };

  player.cooldown = Math.max(0, player.cooldown - 1);
  player.dashCooldown = Math.max(0, player.dashCooldown - 1);
  player.invulnerable = Math.max(0, player.invulnerable - 1);
  player.heat = Math.max(0, player.heat - 0.75);

  if (input.dash && player.dashCooldown === 0) {
    player.dashTime = 9;
    player.dashCooldown = 120;
  }
  const axis = unit(input.moveX, input.moveY);
  const speed = player.dashTime > 0 ? 0.18 : 0.067;
  if (player.dashTime > 0) {
    player.invulnerable = Math.max(player.invulnerable, 2);
    player.dashTime--;
  }
  move(state.arena, player, axis.x * speed, axis.y * speed);

  if (input.shoot && player.cooldown === 0 && player.heat < 85) {
    const aim = unit(input.aimX, input.aimY);
    if (aim.x !== 0 || aim.y !== 0) {
      shots.push({
        x: player.x + aim.x * 0.35,
        y: player.y + aim.y * 0.35,
        dx: aim.x * 0.28,
        dy: aim.y * 0.28,
        hostile: false,
        life: 70,
      });
      player.cooldown = 8;
      player.heat = Math.min(100, player.heat + 22);
    }
  }

  for (const bullet of [...state.shots, ...shots]) {
    const moving = { ...bullet };
    moving.x += moving.dx;
    moving.y += moving.dy;
    moving.life--;
    if (
      moving.life <= 0 ||
      !passable(state.arena, Math.round(moving.x), Math.round(moving.y))
    )
      continue;
    if (moving.hostile) {
      if (distance(moving, player) < 0.31) {
        if (player.invulnerable === 0) {
          player.hp--;
          player.invulnerable = 44;
        }
        continue;
      }
    } else {
      const hit = enemies.find(
        (enemy) => enemy.hp > 0 && distance(enemy, moving) < 0.34,
      );
      if (hit) {
        hit.hp--;
        if (hit.hp === 0) next.score += 100;
        continue;
      }
    }
    shots.push(moving);
  }
  // Shots already inserted for firing are represented by their moved copies.
  const spawned = input.shoot && player.cooldown === 8
    ? 1
    : 0;
  if (spawned) shots.splice(0, spawned);

  next.enemies = enemies.filter((enemy) => enemy.hp > 0);
  for (const enemy of next.enemies) {
    enemy.timer--;
    const range = distance(enemy, player);
    const visible = hasSight(state.arena, enemy, player);
    if (enemy.timer <= 0 && range < 7 && visible) {
      const aim = unit(player.x - enemy.x, player.y - enemy.y);
      shots.push({
        x: enemy.x,
        y: enemy.y,
        dx: aim.x * 0.105,
        dy: aim.y * 0.105,
        hostile: true,
        life: 100,
      });
      enemy.timer = Math.max(45, 108 - state.zone * 12);
    }
    if (range > 0.63) {
      const from = { x: Math.round(enemy.x), y: Math.round(enemy.y) };
      const to = { x: Math.round(player.x), y: Math.round(player.y) };
      const target = nextStep(state.arena, from, to);
      const destination = target ?? player;
      const heading = unit(destination.x - enemy.x, destination.y - enemy.y);
      move(state.arena, enemy, heading.x * 0.019, heading.y * 0.019);
    } else if (player.invulnerable === 0) {
      player.hp--;
      player.invulnerable = 44;
    }
  }

  for (const relay of relays) {
    if (relay.charge < 100 && distance(relay, player) <= 0.85) {
      relay.charge = Math.min(100, relay.charge + 1.5);
      if (relay.charge === 100) {
        player.hp = Math.min(6, player.hp + 1);
        next.score += 200;
      }
    }
  }

  if (player.hp <= 0) {
    next.phase = "lost";
  } else if (
    objectiveReady(next) &&
    distance(player, state.arena.exit) <= 0.76
  ) {
    next.phase = state.zone === MAX_ZONE ? "won" : "cleared";
    next.score += 500;
  }
  return next;
}

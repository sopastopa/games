import {
  generateArena,
  hasSight,
  MAX_ZONE,
  nextStep,
  passable,
  SIZE,
  START,
  visibleCells,
  type Arena,
  type EnemyKind,
  type GateId,
  type Pickup,
  type Point,
} from "./map";

export type Phase =
  "ready" | "playing" | "paused" | "planning" | "cleared" | "won" | "lost";
export type Weapon = "pulse" | "scatter" | "rail";

export interface Pilot extends Point {
  hp: number;
  armor: number;
  weapon: Weapon;
  /** Last movement direction, or the actual firing direction while shooting. */
  facing: Point;
  heat: number;
  cooldown: number;
  dashCooldown: number;
  dashTime: number;
  invulnerable: number;
  scanCharges: number;
}

export interface Sentinel extends Point {
  id: number;
  kind: EnemyKind;
  hp: number;
  timer: number;
  alert: number;
  target: Point | null;
}

export interface Shot extends Point {
  dx: number;
  dy: number;
  hostile: boolean;
  life: number;
  damage: number;
  pierce: number;
  hits: number[];
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
  opened: GateId[];
  keys: GateId[];
  pickups: Pickup[];
  visible: boolean[];
  explored: boolean[];
  waypoint: Point | null;
  notice: string;
  noticeUntil: number;
}

export interface Controls {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  shoot: boolean;
  dash: boolean;
  interact?: boolean;
  scan?: boolean;
}

export const IDLE: Controls = {
  moveX: 0,
  moveY: 0,
  aimX: 1,
  aimY: 0,
  shoot: false,
  dash: false,
};

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function unit(x: number, y: number): Point {
  const length = Math.hypot(x, y);
  return length < 0.001 ? { x: 0, y: 0 } : { x: x / length, y: y / length };
}

export function createGame(seed: number, zone = 1): GameState {
  const arena = generateArena(seed, zone);
  const visible = visibleCells(arena, START);
  return {
    seed,
    zone,
    arena,
    phase: "ready",
    tick: 0,
    score: 0,
    player: {
      ...START,
      hp: 6,
      armor: 0,
      weapon: "pulse",
      facing: { x: 1, y: 0 },
      heat: 0,
      cooldown: 0,
      dashCooldown: 0,
      dashTime: 0,
      invulnerable: 0,
      scanCharges: 2,
    },
    enemies: arena.spawns.map((spawn, id) => ({
      ...spawn,
      id,
      hp: spawn.kind === "bulwark" ? 5 + zone : spawn.kind === "sniper" ? 2 : 3,
      timer: 45 + id * 9,
      alert: 0,
      target: null,
    })),
    relays: arena.relays.map((point) => ({ ...point, charge: 0 })),
    shots: [],
    opened: [],
    keys: [],
    pickups: [...arena.pickups],
    visible,
    explored: [...visible],
    waypoint: null,
    notice: "",
    noticeUntil: 0,
  };
}

function canOccupy(
  arena: Arena,
  x: number,
  y: number,
  gates: readonly GateId[],
): boolean {
  const r = 0.22;
  return (
    passable(arena, Math.round(x - r), Math.round(y - r), gates) &&
    passable(arena, Math.round(x - r), Math.round(y + r), gates) &&
    passable(arena, Math.round(x + r), Math.round(y - r), gates) &&
    passable(arena, Math.round(x + r), Math.round(y + r), gates)
  );
}

function move(
  arena: Arena,
  point: Point,
  dx: number,
  dy: number,
  opened: readonly GateId[],
): void {
  if (canOccupy(arena, point.x + dx, point.y, opened)) point.x += dx;
  if (canOccupy(arena, point.x, point.y + dy, opened)) point.y += dy;
}

export function isEnemyVisible(state: GameState, enemy: Sentinel): boolean {
  const x = Math.round(enemy.x);
  const y = Math.round(enemy.y);
  return (
    x > 0 &&
    y > 0 &&
    x < SIZE - 1 &&
    y < SIZE - 1 &&
    state.visible[y * SIZE + x] === true &&
    hasSight(state.arena, state.player, enemy, state.opened)
  );
}

export function bestAim(state: GameState): Point {
  const visible = state.enemies
    .filter((enemy) => isEnemyVisible(state, enemy))
    .sort((a, b) => distance(a, state.player) - distance(b, state.player));
  const target = visible[0];
  return target
    ? unit(target.x - state.player.x, target.y - state.player.y)
    : { x: 1, y: 0 };
}

export function objectiveReady(state: GameState): boolean {
  return (
    state.enemies.length === 0 &&
    state.relays.every((relay) => relay.charge === 100)
  );
}

function notify(state: GameState, message: string): void {
  state.notice = message;
  state.noticeUntil = state.tick + 200;
}

function collect(state: GameState): void {
  state.pickups = state.pickups.filter((pickup) => {
    if (distance(pickup, state.player) > 0.62) return true;
    const player = state.player;
    switch (pickup.kind) {
      case "key-rose":
        if (!state.keys.includes("rose")) state.keys.push("rose");
        notify(state, "BADGE ROSE • Porte nord-est déverrouillable");
        break;
      case "key-cyan":
        if (!state.keys.includes("cyan")) state.keys.push("cyan");
        notify(state, "BADGE CYAN • Porte sud-ouest déverrouillable");
        break;
      case "scatter":
        player.weapon = "scatter";
        player.heat = 0;
        notify(state, "ARME • TRIANGLE (trois projectiles)");
        break;
      case "rail":
        player.weapon = "rail";
        player.heat = 0;
        notify(state, "ARME • LANCE (tir concentré)");
        break;
      case "armor":
        player.armor = Math.min(4, player.armor + 2);
        notify(state, "BONUS • 2 points d'armure");
        break;
      case "battery":
        player.dashCooldown = 0;
        player.scanCharges = Math.min(3, player.scanCharges + 1);
        notify(state, "BONUS • Propulsion et radar rechargés");
        break;
      case "radar":
        player.scanCharges = Math.min(3, player.scanCharges + 2);
        notify(state, "BONUS • 2 impulsions de reconnaissance");
        break;
    }
    state.score += 35;
    return false;
  });
}

export function availableGate(state: GameState): GateId | null {
  const closest = state.arena.doors
    .filter(
      (gate) =>
        !state.opened.includes(gate.id) && distance(gate, state.player) < 1.8,
    )
    .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0];
  return closest?.id ?? null;
}

export function canOpenGate(state: GameState, id: GateId): boolean {
  return id === "core"
    ? state.relays.slice(0, 2).every((relay) => relay.charge === 100)
    : state.keys.includes(id);
}

function operateGate(state: GameState): void {
  const id = availableGate(state);
  if (!id) return;
  if (!canOpenGate(state, id)) {
    notify(
      state,
      id === "core"
        ? "PORTE OR • Active les relais rose et cyan"
        : "ACCÈS REFUSÉ • Trouve le badge " + id.toUpperCase(),
    );
    return;
  }
  state.opened.push(id);
  notify(state, "PORTE " + id.toUpperCase() + " • Passage ouvert");
  state.score += 100;
}

function damagePlayer(player: Pilot): void {
  if (player.invulnerable > 0) return;
  if (player.armor > 0) player.armor--;
  else player.hp--;
  player.invulnerable = 48;
}

function spawnFriendly(state: GameState, aim: Point): Shot[] {
  const weapon = state.player.weapon;
  const player = state.player;
  const spread = weapon === "scatter" ? [-0.19, 0, 0.19] : [0];
  const velocity =
    weapon === "rail" ? 0.48 : weapon === "scatter" ? 0.25 : 0.31;
  return spread.map((angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = aim.x * cos - aim.y * sin;
    const dy = aim.x * sin + aim.y * cos;
    return {
      x: player.x + dx * 0.36,
      y: player.y + dy * 0.36,
      dx: dx * velocity,
      dy: dy * velocity,
      hostile: false,
      life: weapon === "rail" ? 70 : 52,
      damage: weapon === "rail" ? 3 : 1,
      pierce: weapon === "rail" ? 2 : 1,
      hits: [],
    };
  });
}

function travel(state: GameState, shots: Shot[]): Shot[] {
  const remaining: Shot[] = [];
  for (const previous of shots) {
    const bullet: Shot = {
      ...previous,
      hits: [...previous.hits],
      life: previous.life - 1,
    };
    if (bullet.life <= 0) continue;
    let stopped = false;
    const steps = Math.ceil(Math.hypot(bullet.dx, bullet.dy) / 0.09);
    for (let part = 0; part < steps; part++) {
      bullet.x += bullet.dx / steps;
      bullet.y += bullet.dy / steps;
      if (
        !passable(
          state.arena,
          Math.round(bullet.x),
          Math.round(bullet.y),
          state.opened,
        )
      ) {
        stopped = true;
        break;
      }
      if (bullet.hostile) {
        if (distance(bullet, state.player) < 0.32) {
          damagePlayer(state.player);
          stopped = true;
          break;
        }
      } else {
        const enemy = state.enemies.find(
          (target) =>
            target.hp > 0 &&
            !bullet.hits.includes(target.id) &&
            distance(bullet, target) < 0.35,
        );
        if (enemy) {
          enemy.hp -= bullet.damage;
          bullet.hits.push(enemy.id);
          if (enemy.hp <= 0)
            state.score += enemy.kind === "bulwark" ? 220 : 100;
          if (bullet.hits.length >= bullet.pierce) {
            stopped = true;
            break;
          }
        }
      }
    }
    if (!stopped) remaining.push(bullet);
  }
  return remaining;
}

function simulateEnemies(state: GameState): void {
  const player = state.player;
  for (const enemy of state.enemies) {
    const range = distance(enemy, player);
    const seen =
      range <= 7 && hasSight(state.arena, enemy, player, state.opened);
    if (seen) enemy.alert = 150;
    else enemy.alert = Math.max(0, enemy.alert - 1);
    if (enemy.alert === 0) continue;
    enemy.timer--;
    const speed =
      enemy.kind === "hunter"
        ? 0.035
        : enemy.kind === "bulwark"
          ? 0.015
          : 0.018;
    if (enemy.kind === "hunter") {
      if (range > 0.72) advanceEnemy(state, enemy, speed, seen);
      else if (enemy.timer <= 0) {
        damagePlayer(player);
        enemy.timer = 60;
      }
    } else {
      const threshold = enemy.kind === "sniper" ? 3.5 : 2.1;
      if (range > (enemy.kind === "sniper" ? 6 : 4)) {
        advanceEnemy(state, enemy, speed, seen);
      } else if (range < threshold && seen) {
        const backwards = unit(enemy.x - player.x, enemy.y - player.y);
        move(
          state.arena,
          enemy,
          backwards.x * speed,
          backwards.y * speed,
          state.opened,
        );
      }
      if (seen && range < 8 && enemy.timer <= 0) {
        const heading = unit(player.x - enemy.x, player.y - enemy.y);
        state.shots.push({
          ...enemy,
          dx: heading.x * (enemy.kind === "sniper" ? 0.17 : 0.105),
          dy: heading.y * (enemy.kind === "sniper" ? 0.17 : 0.105),
          hostile: true,
          life: 90,
          damage: 1,
          pierce: 1,
          hits: [],
        });
        enemy.timer = enemy.kind === "sniper" ? 120 : 105;
      }
    }
  }
}

function advanceEnemy(
  state: GameState,
  enemy: Sentinel,
  speed: number,
  seen: boolean,
): void {
  if (!seen && state.tick % 20 !== enemy.id % 20 && enemy.target === null)
    return;
  if (seen) {
    enemy.target = { x: state.player.x, y: state.player.y };
  }
  if (!enemy.target) return;
  let goal: Point = enemy.target;
  if (!hasSight(state.arena, enemy, goal, state.opened)) {
    const node = nextStep(
      state.arena,
      { x: Math.round(enemy.x), y: Math.round(enemy.y) },
      { x: Math.round(goal.x), y: Math.round(goal.y) },
      state.opened,
    );
    if (!node) return;
    goal = node;
  }
  const heading = unit(goal.x - enemy.x, goal.y - enemy.y);
  move(state.arena, enemy, heading.x * speed, heading.y * speed, state.opened);
}

function updateFog(state: GameState): void {
  // Vision and persistent terrain memory are separate. Radar explores without
  // exposing live enemy positions behind walls.
  const vision = visibleCells(state.arena, state.player, state.opened);
  state.visible = vision;
  const explored = [...state.explored];
  for (let index = 0; index < vision.length; index++) {
    if (vision[index]) explored[index] = true;
  }
  state.explored = explored;
}

export function stepGame(state: GameState, input: Controls): GameState {
  if (state.phase !== "playing") return state;
  const player: Pilot = { ...state.player };
  const next: GameState = {
    ...state,
    tick: state.tick + 1,
    player,
    enemies: state.enemies.map((enemy) => ({
      ...enemy,
      target: enemy.target ? { ...enemy.target } : null,
    })),
    shots: state.shots.map((shot) => ({ ...shot, hits: [...shot.hits] })),
    relays: state.relays.map((relay) => ({ ...relay })),
    keys: [...state.keys],
    opened: [...state.opened],
    pickups: [...state.pickups],
  };

  player.cooldown = Math.max(0, player.cooldown - 1);
  player.dashCooldown = Math.max(0, player.dashCooldown - 1);
  player.invulnerable = Math.max(0, player.invulnerable - 1);
  player.heat = Math.max(0, player.heat - 0.8);
  if (input.dash && player.dashCooldown === 0) {
    player.dashTime = 9;
    player.dashCooldown = 120;
  }
  const axis = unit(input.moveX, input.moveY);
  const aimDirection = unit(input.aimX, input.aimY);
  if (input.shoot && (aimDirection.x !== 0 || aimDirection.y !== 0)) {
    player.facing = aimDirection;
  } else if (axis.x !== 0 || axis.y !== 0) {
    player.facing = axis;
  }
  const speed = player.dashTime > 0 ? 0.18 : 0.072;
  if (player.dashTime > 0) {
    player.invulnerable = Math.max(player.invulnerable, 2);
    player.dashTime--;
  }
  move(next.arena, player, axis.x * speed, axis.y * speed, next.opened);
  collect(next);
  if (input.interact) operateGate(next);
  if (input.scan && player.scanCharges > 0) {
    player.scanCharges--;
    const radius = 11;
    const explored = [...next.explored];
    for (
      let y = Math.max(1, Math.floor(player.y - radius));
      y <= Math.min(SIZE - 2, player.y + radius);
      y++
    ) {
      for (
        let x = Math.max(1, Math.floor(player.x - radius));
        x <= Math.min(SIZE - 2, player.x + radius);
        x++
      ) {
        if (Math.hypot(x - player.x, y - player.y) <= radius)
          explored[y * SIZE + x] = true;
      }
    }
    next.explored = explored;
    notify(next, "RECONNAISSANCE • Secteur cartographié");
  }
  if (input.shoot && player.cooldown === 0 && player.heat < 85) {
    const aim = unit(input.aimX, input.aimY);
    if (aim.x !== 0 || aim.y !== 0) {
      const cadence =
        player.weapon === "rail" ? 22 : player.weapon === "scatter" ? 18 : 8;
      const heat =
        player.weapon === "rail" ? 32 : player.weapon === "scatter" ? 27 : 17;
      next.shots.push(...spawnFriendly(next, aim));
      player.cooldown = cadence;
      player.heat = Math.min(100, player.heat + heat);
    }
  }
  next.shots = travel(next, next.shots);
  next.enemies = next.enemies.filter((enemy) => enemy.hp > 0);
  simulateEnemies(next);
  for (const relay of next.relays) {
    if (relay.charge < 100 && distance(relay, player) <= 0.85) {
      relay.charge = Math.min(100, relay.charge + 1.5);
      if (relay.charge === 100) {
        player.hp = Math.min(6, player.hp + 1);
        player.scanCharges = Math.min(3, player.scanCharges + 1);
        next.score += 200;
        notify(next, "RELAIS SYNCHRONISÉ • Blindage et radar rechargés");
      }
    }
  }
  // Recompute vision after movement and gate changes; enemies cannot target
  // the player through opaque geometry, even when scanned.
  if (
    Math.round(player.x) !== Math.round(state.player.x) ||
    Math.round(player.y) !== Math.round(state.player.y) ||
    next.opened.length !== state.opened.length ||
    next.tick % 8 === 0
  )
    updateFog(next);
  if (next.waypoint && distance(next.waypoint, player) < 0.85)
    next.waypoint = null;
  if (player.hp <= 0) {
    next.phase = "lost";
  } else if (objectiveReady(next) && distance(player, next.arena.exit) <= 0.8) {
    next.phase = next.zone === MAX_ZONE ? "won" : "cleared";
    next.score += 500;
  }
  return next;
}

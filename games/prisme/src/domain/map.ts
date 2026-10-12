export const SIZE = 41;
export const MAX_ZONE = 4;
export const START = { x: 5, y: 5 } as const;

export interface Point {
  x: number;
  y: number;
}

export type GateId = "rose" | "cyan" | "core";
export type PickupKind =
  "key-rose" | "key-cyan" | "scatter" | "rail" | "armor" | "battery" | "radar";
export type EnemyKind = "hunter" | "sniper" | "bulwark";

export interface Gate extends Point {
  id: GateId;
}

export interface Pickup extends Point {
  id: number;
  kind: PickupKind;
}

export interface Spawn extends Point {
  kind: EnemyKind;
}

export interface Arena {
  readonly walls: readonly boolean[];
  readonly relays: readonly Point[];
  readonly exit: Point;
  readonly doors: readonly Gate[];
  readonly pickups: readonly Pickup[];
  readonly spawns: readonly Spawn[];
}

export function randomGenerator(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cell(point: Point): number {
  return point.y * SIZE + point.x;
}

export function inside(x: number, y: number): boolean {
  return x >= 1 && y >= 1 && x < SIZE - 1 && y < SIZE - 1;
}

export function doorAt(arena: Arena, x: number, y: number): Gate | undefined {
  return arena.doors.find((door) => door.x === x && door.y === y);
}

export function passable(
  arena: Arena,
  x: number,
  y: number,
  opened: readonly GateId[] = [],
): boolean {
  if (!inside(x, y) || arena.walls[y * SIZE + x]) return false;
  const gate = doorAt(arena, x, y);
  return !gate || opened.includes(gate.id);
}

export function neighbors(
  arena: Arena,
  point: Point,
  opened: readonly GateId[] = [],
): Point[] {
  return [
    { x: point.x, y: point.y - 1 },
    { x: point.x + 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x - 1, y: point.y },
  ].filter((next) => passable(arena, next.x, next.y, opened));
}

export function reachable(
  arena: Arena,
  start: Point,
  opened: readonly GateId[] = [],
): Set<number> {
  const visited = new Set<number>([cell(start)]);
  const queue: Point[] = [start];
  for (let index = 0; index < queue.length; index++) {
    for (const next of neighbors(arena, queue[index]!, opened)) {
      if (visited.has(cell(next))) continue;
      visited.add(cell(next));
      queue.push(next);
    }
  }
  return visited;
}

export function nextStep(
  arena: Arena,
  from: Point,
  to: Point,
  opened: readonly GateId[] = [],
): Point | null {
  if (cell(from) === cell(to)) return null;
  const seen = new Set<number>([cell(from)]);
  const queue: { point: Point; first: Point }[] = [];
  for (const neighbor of neighbors(arena, from, opened)) {
    seen.add(cell(neighbor));
    queue.push({ point: neighbor, first: neighbor });
  }
  for (let index = 0; index < queue.length; index++) {
    const item = queue[index]!;
    if (cell(item.point) === cell(to)) return item.first;
    for (const neighbor of neighbors(arena, item.point, opened)) {
      if (seen.has(cell(neighbor))) continue;
      seen.add(cell(neighbor));
      queue.push({ point: neighbor, first: item.first });
    }
  }
  return null;
}

export function hasSight(
  arena: Arena,
  from: Point,
  to: Point,
  opened: readonly GateId[] = [],
): boolean {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) * 5);
  for (let i = 1; i < steps; i++) {
    const x = Math.round(from.x + ((to.x - from.x) * i) / steps);
    const y = Math.round(from.y + ((to.y - from.y) * i) / steps);
    // The target surface may be an opaque wall: show its front face,
    // but never reveal cells or actors hidden behind it.
    if (
      (x !== Math.round(to.x) || y !== Math.round(to.y)) &&
      !passable(arena, x, y, opened)
    )
      return false;
  }
  return true;
}

/** Exact terrain visibility: explored terrain persists, hostile units do not. */
export function visibleCells(
  arena: Arena,
  origin: Point,
  opened: readonly GateId[] = [],
  radius = 7,
): boolean[] {
  const visible = Array<boolean>(SIZE * SIZE).fill(false);
  const x0 = Math.round(origin.x);
  const y0 = Math.round(origin.y);
  for (
    let y = Math.max(1, y0 - radius);
    y <= Math.min(SIZE - 2, y0 + radius);
    y++
  ) {
    for (
      let x = Math.max(1, x0 - radius);
      x <= Math.min(SIZE - 2, x0 + radius);
      x++
    ) {
      if (Math.hypot(x - origin.x, y - origin.y) > radius) continue;
      if (hasSight(arena, origin, { x, y }, opened))
        visible[y * SIZE + x] = true;
    }
  }
  visible[cell({ x: x0, y: y0 })] = true;
  return visible;
}

function center(col: number, row: number): Point {
  return { x: 5 + col * 10, y: 5 + row * 10 };
}

/**
 * Four connected districts (northwest -> east/south -> southeast).
 * The two initial keycards are guaranteed accessible before their locks.
 * The last district requires the first two relays. World size is 41x41.
 */
export function generateArena(seed: number, zone: number): Arena {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 999999999)
    throw new Error("Invalid arena seed");
  if (!Number.isInteger(zone) || zone < 1 || zone > MAX_ZONE)
    throw new Error("Invalid zone");
  const random = randomGenerator((seed ^ Math.imul(zone, 0x9e3779b9)) >>> 0);
  const walls = Array.from({ length: SIZE * SIZE }, (_, index) => {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    if (!inside(x, y)) return true;
    if (x % 10 === 0 || y % 10 === 0) return true;
    // Main streets of every room always remain traversable.
    if (x % 10 === 5 || y % 10 === 5) return false;
    return random() < 0.17;
  });
  const open = (x: number, y: number): void => {
    walls[y * SIZE + x] = false;
  };
  const doors: Gate[] = [];
  for (let border = 10; border <= 30; border += 10) {
    for (let coordinate = 5; coordinate <= 35; coordinate += 10) {
      open(border, coordinate);
      open(coordinate, border);
      if (border === 20) {
        doors.push({
          x: border,
          y: coordinate,
          id: coordinate < 20 ? "rose" : "core",
        });
        doors.push({
          x: coordinate,
          y: border,
          id: coordinate < 20 ? "cyan" : "core",
        });
      }
    }
  }
  const relays = [center(3, 0), center(0, 3), center(2, 3)];
  const exit = center(3, 3);
  const pickups: Pickup[] = [
    { ...center(1, 0), kind: "key-rose", id: 0 },
    { ...center(0, 1), kind: "key-cyan", id: 1 },
    { ...center(1, 1), kind: "armor", id: 2 },
  ];
  const kinds: PickupKind[] = ["scatter", "rail", "armor", "radar", "battery"];
  const candidateRooms = [
    center(2, 0),
    center(3, 1),
    center(0, 2),
    center(1, 3),
    center(2, 2),
    center(3, 2),
    center(2, 1),
    center(1, 2),
  ];
  for (let index = 0; index < candidateRooms.length; index++) {
    pickups.push({
      ...candidateRooms[index]!,
      id: index + 3,
      kind:
        index === 0
          ? "scatter"
          : index === 2
            ? "rail"
            : kinds[Math.floor(random() * kinds.length)]!,
    });
  }
  // Placing enemies only on guaranteed open main corridors avoids stranded units.
  const reserved = [...pickups, ...relays, exit, START];
  const positions: Point[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const origin = center(col, row);
      if (col === 0 && row === 0) continue;
      for (const offset of [
        { x: -3, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: -3 },
        { x: 0, y: 3 },
      ]) {
        const point = { x: origin.x + offset.x, y: origin.y + offset.y };
        if (
          reserved.every(
            (target) => Math.hypot(point.x - target.x, point.y - target.y) > 2,
          )
        )
          positions.push(point);
      }
    }
  }
  for (let index = positions.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [positions[index], positions[other]] = [
      positions[other]!,
      positions[index]!,
    ];
  }
  const kindOrder: EnemyKind[] = ["hunter", "sniper", "bulwark"];
  const spawns: Spawn[] = positions
    .slice(0, 5 + zone * 3)
    .map((point, index) => ({
      ...point,
      kind: kindOrder[(index + zone) % kindOrder.length]!,
    }));
  return { walls, relays, exit, doors, pickups, spawns };
}

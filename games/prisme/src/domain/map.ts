export const SIZE = 13;
export const MAX_ZONE = 4;

export interface Point {
  x: number;
  y: number;
}

export interface Arena {
  readonly walls: readonly boolean[];
  readonly relays: readonly Point[];
  readonly exit: Point;
  readonly spawns: readonly Point[];
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

export function passable(arena: Arena, x: number, y: number): boolean {
  return inside(x, y) && !arena.walls[y * SIZE + x];
}

export function neighbors(arena: Arena, point: Point): Point[] {
  return [
    { x: point.x, y: point.y - 1 },
    { x: point.x + 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x - 1, y: point.y },
  ].filter((next) => passable(arena, next.x, next.y));
}

export function reachable(arena: Arena, start: Point): Set<number> {
  const visited = new Set<number>([cell(start)]);
  const queue: Point[] = [start];
  for (let index = 0; index < queue.length; index++) {
    for (const next of neighbors(arena, queue[index])) {
      if (!visited.has(cell(next))) {
        visited.add(cell(next));
        queue.push(next);
      }
    }
  }
  return visited;
}

export function nextStep(
  arena: Arena,
  from: Point,
  to: Point,
): Point | null {
  if (from.x === to.x && from.y === to.y) return null;
  const seen = new Set<number>([cell(from)]);
  const queue: { point: Point; first: Point }[] = [];
  for (const neighbor of neighbors(arena, from)) {
    seen.add(cell(neighbor));
    queue.push({ point: neighbor, first: neighbor });
  }
  for (let index = 0; index < queue.length; index++) {
    const item = queue[index];
    if (item.point.x === to.x && item.point.y === to.y) return item.first;
    for (const neighbor of neighbors(arena, item.point)) {
      if (seen.has(cell(neighbor))) continue;
      seen.add(cell(neighbor));
      queue.push({ point: neighbor, first: item.first });
    }
  }
  return null;
}

export function hasSight(arena: Arena, from: Point, to: Point): boolean {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.ceil(distance * 8);
  for (let i = 1; i < steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    if (!passable(arena, Math.round(x), Math.round(y))) return false;
  }
  return true;
}

export function generateArena(seed: number, zone: number): Arena {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 999999999)
    throw new Error("Invalid arena seed");
  if (!Number.isInteger(zone) || zone < 1 || zone > MAX_ZONE)
    throw new Error("Invalid zone");
  const random = randomGenerator((seed ^ Math.imul(zone, 0x9e3779b9)) >>> 0);
  const walls = Array.from({ length: SIZE * SIZE }, (_, index) => {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    return !inside(x, y) || random() < 0.23;
  });
  const relays: Point[] = [
    { x: 2 + Math.floor(random() * 3), y: 2 + Math.floor(random() * 3) },
    { x: 8 + Math.floor(random() * 3), y: 2 + Math.floor(random() * 3) },
    { x: 8 + Math.floor(random() * 3), y: 8 + Math.floor(random() * 3) },
  ];
  const start = { x: 6, y: 6 };
  const exit = { x: 2, y: 10 };
  const open = (x: number, y: number): void => {
    if (inside(x, y)) walls[y * SIZE + x] = false;
  };
  // Carve guaranteed corridors before placing threats. Keep the spawn safe.
  for (const goal of [...relays, exit]) {
    let x = start.x;
    let y = start.y;
    open(x, y);
    if (random() < 0.5) {
      while (x !== goal.x) {
        x += Math.sign(goal.x - x);
        open(x, y);
      }
      while (y !== goal.y) {
        y += Math.sign(goal.y - y);
        open(x, y);
      }
    } else {
      while (y !== goal.y) {
        y += Math.sign(goal.y - y);
        open(x, y);
      }
      while (x !== goal.x) {
        x += Math.sign(goal.x - x);
        open(x, y);
      }
    }
  }
  for (const point of [start, ...relays, exit]) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 1) open(point.x + dx, point.y + dy);
      }
    }
  }
  const partial: Arena = { walls, relays, exit, spawns: [] };
  const connected = reachable(partial, start);
  const positions: Point[] = [...connected]
    .map((index) => ({ x: index % SIZE, y: Math.floor(index / SIZE) }))
    .filter(
      (point) =>
        Math.hypot(point.x - start.x, point.y - start.y) >= 4 &&
        ![...relays, exit].some(
          (goal) => Math.hypot(goal.x - point.x, goal.y - point.y) < 1.5,
        ),
    );
  // Seeded Fisher-Yates ensures reproducible enemy placement.
  for (let index = positions.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [positions[index], positions[other]] = [positions[other], positions[index]];
  }
  const spawns = positions.slice(0, 2 + zone * 2);
  if (spawns.length !== 2 + zone * 2)
    throw new Error("Map has insufficient spawn positions");
  return { walls, relays, exit, spawns };
}

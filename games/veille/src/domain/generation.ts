import { EXIT, SIZE, START, type Drone, type Terrain } from "./types";

/** Reproducible, side-effect-free integer random generator. */
export function randomSequence(seed: number): () => number {
  let state = (seed >>> 0) || 0x6d2b79f5;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

export function neighbors(index: number): number[] {
  const x = index % SIZE;
  const y = Math.floor(index / SIZE);
  return [
    ...(y > 0 ? [index - SIZE] : []),
    ...(x < SIZE - 1 ? [index + 1] : []),
    ...(y < SIZE - 1 ? [index + SIZE] : []),
    ...(x > 0 ? [index - 1] : []),
  ];
}

export function distance(a: number, b: number): number {
  return Math.abs((a % SIZE) - (b % SIZE)) + Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE));
}

export function shortestPath(terrain: readonly Terrain[], from: number, to: number, avoidTide = false): number[] {
  if (from === to) return [from];
  const queue = [from];
  const previous = new Map<number, number>([[from, from]]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]!;
    for (const next of neighbors(current)) {
      if (previous.has(next) || terrain[next] === "wall" || (avoidTide && terrain[next] === "tide")) continue;
      previous.set(next, current);
      if (next === to) {
        const path = [to];
        while (path[0] !== from) path.unshift(previous.get(path[0]!)!);
        return path;
      }
      queue.push(next);
    }
  }
  return [];
}

export interface GeneratedMap {
  terrain: Terrain[];
  drones: Drone[];
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function generateMap(sector: number, seed: number): GeneratedMap {
  const random = randomSequence(seed ^ Math.imul(sector + 1, 0x9e3779b1));
  const interior = Array.from({ length: SIZE * SIZE }, (_, position) => position).filter((position) => {
    const x = position % SIZE;
    const y = Math.floor(position / SIZE);
    return x > 0 && x < SIZE - 1 && y > 0 && y < SIZE - 1 && position !== START && position !== EXIT;
  });
  const terrain: Terrain[] = Array.from({ length: SIZE * SIZE }, (_, position) => {
    const x = position % SIZE;
    const y = Math.floor(position / SIZE);
    return x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1 ? "wall" : "floor";
  });
  // Add cover only when an alternative remains. No unsolvable seeded layouts.
  let walls = 0;
  for (const position of shuffle(interior, random)) {
    if (walls >= 5 + Math.floor(sector / 2)) break;
    terrain[position] = "wall";
    if (shortestPath(terrain, START, EXIT).length === 0 ||
        interior.some((cell) => terrain[cell] !== "wall" && shortestPath(terrain, START, cell).length === 0)) {
      terrain[position] = "floor";
    } else walls++;
  }
  const pool = shuffle(interior.filter((pos) => terrain[pos] === "floor" && distance(pos, START) > 1 && distance(pos, EXIT) > 1), random);
  const place = (kind: Terrain, count: number): void => {
    for (let i = 0; i < count && pool.length; i++) terrain[pool.pop()!] = kind;
  };
  const cores = 2 + Math.floor(sector / 4);
  place("core", cores);
  place("archive", 3);
  place("battery", 3 + Math.floor(sector / 5));
  place("beacon", 2);
  if (sector > 0) place("tide", 4 + Math.min(8, sector));
  terrain[EXIT] = "exit";
  const drones: Drone[] = [];
  const enemyPositions = shuffle(pool.filter((cell) => distance(cell, START) >= 5), random);
  for (let i = 0; i < Math.min(4, Math.floor((sector + 1) / 3)) && i < enemyPositions.length; i++) {
    const position = enemyPositions[i]!;
    drones.push({ position, home: position, stunned: 0 });
  }
  return { terrain, drones };
}

import { distance, generateMap, neighbors, shortestPath } from "./generation";
import { ROLES } from "./sectors";
import {
  EXIT,
  MAX_ENERGY,
  SECTOR_COUNT,
  SIZE,
  START,
  type Action,
  type Direction,
  type Expedition,
  type Role,
  type Terrain,
} from "./types";

export function within(position: number, radius: number): number[] {
  return Array.from({ length: SIZE * SIZE }, (_, index) => index).filter(
    (index) => distance(index, position) <= radius,
  );
}

function reveal(state: Expedition, radius: number): void {
  for (const cell of within(state.position, radius))
    state.revealed[cell] = true;
}

export function newExpedition(
  sector: number,
  seed: number,
  role: Role,
): Expedition {
  if (!Number.isInteger(sector) || sector < 0 || sector >= SECTOR_COUNT)
    throw new Error("Invalid sector");
  if (!Number.isSafeInteger(seed)) throw new Error("Invalid seed");
  const { terrain, drones } = generateMap(sector, seed);
  const maxHull = ROLES[role].hull;
  const state: Expedition = {
    sector,
    seed,
    role,
    terrain,
    drones,
    revealed: Array(SIZE * SIZE).fill(false),
    position: START,
    hull: maxHull,
    maxHull,
    energy: role === "engineer" ? MAX_ENERGY : 5,
    cores: 0,
    required: 2 + Math.floor(sector / 4),
    archives: 0,
    turn: 0,
    phase: "playing",
    log: "Explore les alentours. Les données orange sont indispensables.",
  };
  reveal(state, role === "scout" ? 3 : 2);
  return state;
}

export function tideIsHigh(turn: number): boolean {
  return turn % 6 >= 3;
}

export function offset(position: number, direction: Direction): number | null {
  const x = position % SIZE;
  const y = Math.floor(position / SIZE);
  if (direction === "up" && y > 0) return position - SIZE;
  if (direction === "down" && y < SIZE - 1) return position + SIZE;
  if (direction === "left" && x > 0) return position - 1;
  if (direction === "right" && x < SIZE - 1) return position + 1;
  return null;
}

export function actionAvailable(state: Expedition, action: Action): boolean {
  if (state.phase !== "playing") return false;
  if (action.kind === "wait") return true;
  if (action.kind === "scan") return state.energy >= ROLES[state.role].scanCost;
  if (action.kind === "pulse") {
    return (
      state.energy >= 2 &&
      state.drones.some(
        (drone) => distance(drone.position, state.position) <= 2,
      )
    );
  }
  if (action.kind === "dash" && state.energy < 2) return false;
  let next: number | null = state.position;
  const steps = action.kind === "dash" ? ROLES[state.role].dashDistance : 1;
  for (let i = 0; i < steps; i++) {
    next = next === null ? null : offset(next, action.direction);
    if (
      next === null ||
      state.terrain[next] === "wall" ||
      state.drones.some((drone) => drone.position === next)
    )
      return false;
  }
  return true;
}

function acquire(state: Expedition): void {
  const terrain = state.terrain[state.position];
  if (terrain === "core") {
    state.cores++;
    state.terrain[state.position] = "floor";
    state.log = `Fragment de signal ${state.cores}/${state.required} récupéré.`;
  } else if (terrain === "archive") {
    state.archives++;
    state.terrain[state.position] = "floor";
    state.log = `Archive cachée retrouvée (${state.archives}/3).`;
  } else if (terrain === "battery" || terrain === "beacon") {
    state.energy = Math.min(
      MAX_ENERGY,
      state.energy + (terrain === "beacon" ? 4 : 3),
    );
    if (terrain === "beacon" && state.role === "engineer")
      state.hull = Math.min(state.maxHull, state.hull + 1);
    state.terrain[state.position] = "floor";
    state.log =
      terrain === "beacon"
        ? "Station de recharge activée."
        : "Cellule d'énergie récupérée.";
  } else if (terrain === "exit" && state.cores < state.required) {
    state.log = `Il manque ${state.required - state.cores} fragment(s) avant l'extraction.`;
  }
}

function moveDrones(state: Expedition): void {
  if (state.turn % 2 !== 0) return;
  const taken = new Set(state.drones.map((drone) => drone.position));
  for (const drone of state.drones) {
    if (drone.stunned > 0) continue;
    if (distance(drone.position, state.position) === 1) {
      state.hull--;
      state.log =
        "Une sentinelle a touché la coque. Utilise l'impulsion pour l'écarter.";
      continue;
    }
    if (distance(drone.position, state.position) > 5) continue;
    const path = shortestPath(state.terrain, drone.position, state.position);
    const next = path[1];
    if (next !== undefined && next !== state.position && !taken.has(next)) {
      taken.delete(drone.position);
      drone.position = next;
      taken.add(next);
    }
  }
}

export function transition(previous: Expedition, action: Action): Expedition {
  if (!actionAvailable(previous, action)) return previous;
  const state: Expedition = {
    ...previous,
    terrain: [...previous.terrain],
    revealed: [...previous.revealed],
    drones: previous.drones.map((drone) => ({ ...drone })),
  };
  if (action.kind === "scan") {
    state.energy -= ROLES[state.role].scanCost;
    reveal(state, 5);
    state.log = "Balayage complet : les corridors environnants sont visibles.";
  } else if (action.kind === "pulse") {
    state.energy -= 2;
    for (const drone of state.drones) {
      if (distance(drone.position, state.position) <= 2) {
        drone.position = drone.home;
        drone.stunned = 3;
      }
    }
    state.log = "Impulsion magnétique : les sentinelles sont repoussées.";
  } else if (action.kind === "wait") {
    state.log = "Tu observes le courant. La marée poursuit son cycle.";
  } else {
    const steps = action.kind === "dash" ? ROLES[state.role].dashDistance : 1;
    if (action.kind === "dash") state.energy -= 2;
    for (let i = 0; i < steps; i++) {
      state.position = offset(state.position, action.direction)!;
      acquire(state);
    }
  }
  state.turn++;
  for (const drone of state.drones) {
    if (drone.stunned > 0) drone.stunned--;
  }
  reveal(state, state.role === "scout" ? 3 : 2);
  if (state.terrain[state.position] === "tide" && tideIsHigh(state.turn)) {
    state.hull--;
    state.log = "Marée haute : la pression endommage la coque.";
  }
  if (state.position === EXIT && state.cores >= state.required) {
    state.phase = "won";
    state.log = "Extraction réussie. Une page de l'histoire est restaurée.";
    return state;
  }
  moveDrones(state);
  if (state.hull <= 0) {
    state.hull = 0;
    state.phase = "lost";
    state.log =
      "La coque a cédé. Recommence cette expédition sans perdre tes découvertes.";
  }
  return state;
}

export function directionBetween(from: number, to: number): Direction | null {
  if (!neighbors(from).includes(to)) return null;
  if (to === from - SIZE) return "up";
  if (to === from + SIZE) return "down";
  if (to === from - 1) return "left";
  return "right";
}

export function validateExpedition(value: unknown): value is Expedition {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Expedition>;
  const roles: Role[] = ["scout", "engineer", "guardian"];
  const terrains: Terrain[] = [
    "floor",
    "wall",
    "tide",
    "core",
    "battery",
    "beacon",
    "archive",
    "exit",
  ];
  return (
    Number.isInteger(v.sector) &&
    (v.sector ?? -1) >= 0 &&
    (v.sector ?? 12) < SECTOR_COUNT &&
    Number.isSafeInteger(v.seed) &&
    roles.includes(v.role as Role) &&
    Array.isArray(v.terrain) &&
    v.terrain.length === SIZE * SIZE &&
    v.terrain.every((cell) => terrains.includes(cell)) &&
    Array.isArray(v.revealed) &&
    v.revealed.length === SIZE * SIZE &&
    v.revealed.every((cell) => typeof cell === "boolean") &&
    Number.isInteger(v.position) &&
    (v.position ?? -1) >= 0 &&
    (v.position ?? 81) < SIZE * SIZE &&
    Number.isInteger(v.turn) &&
    (v.turn ?? -1) >= 0 &&
    Number.isInteger(v.hull) &&
    (v.hull ?? -1) >= 0 &&
    (v.hull ?? 100) <= 10 &&
    Number.isInteger(v.maxHull) &&
    (v.maxHull ?? -1) > 0 &&
    (v.maxHull ?? 100) <= 10 &&
    Number.isInteger(v.energy) &&
    (v.energy ?? -1) >= 0 &&
    (v.energy ?? 100) <= MAX_ENERGY &&
    Number.isInteger(v.cores) &&
    (v.cores ?? -1) >= 0 &&
    (v.cores ?? 100) <= 4 &&
    Number.isInteger(v.required) &&
    (v.required ?? -1) >= 2 &&
    (v.required ?? 100) <= 4 &&
    Number.isInteger(v.archives) &&
    (v.archives ?? -1) >= 0 &&
    (v.archives ?? 100) <= 3 &&
    ["playing", "won", "lost"].includes(v.phase ?? "") &&
    typeof v.log === "string" &&
    v.log.length < 500 &&
    Array.isArray(v.drones) &&
    v.drones.length <= 4 &&
    v.drones.every(
      (drone) =>
        Number.isInteger(drone.position) &&
        drone.position >= 0 &&
        drone.position < SIZE * SIZE &&
        Number.isInteger(drone.home) &&
        drone.home >= 0 &&
        drone.home < SIZE * SIZE &&
        Number.isInteger(drone.stunned) &&
        drone.stunned >= 0 &&
        drone.stunned <= 3,
    )
  );
}

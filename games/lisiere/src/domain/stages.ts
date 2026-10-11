import type { Stage } from "./types";

export const BOARD_SIZE = 6;
export const TOTAL_CELLS = BOARD_SIZE ** 2;
export const HOMES = { player: 12, ai: 23 } as const;

const mirror = (index: number): number => TOTAL_CELLS - 1 - index;

function symmetric(indices: readonly number[]): number[] {
  return [...new Set(indices.flatMap((index) => [index, mirror(index)]))].sort(
    (a, b) => a - b,
  );
}

const designs = [
  {
    title: "La première rive",
    subtitle: "Deux territoires, une seule frontière.",
    chapter: "I · PREMIÈRES FRONTIÈRES",
    depth: 1,
    rocks: [],
    sanctuaries: [8, 14],
  },
  {
    title: "Les terres hautes",
    subtitle: "Les sanctuaires attirent les deux camps.",
    chapter: "I · PREMIÈRES FRONTIÈRES",
    depth: 1,
    rocks: [15],
    sanctuaries: [7, 14],
  },
  {
    title: "Passages étroits",
    subtitle: "Contrôler un goulet change toute la partie.",
    chapter: "I · PREMIÈRES FRONTIÈRES",
    depth: 1,
    rocks: [9, 14],
    sanctuaries: [4, 13],
  },
  {
    title: "Terres disputées",
    subtitle: "Chaque attaque ouvre une riposte.",
    chapter: "II · RÉSEAUX D'INFLUENCE",
    depth: 2,
    rocks: [8],
    sanctuaries: [13, 16],
  },
  {
    title: "L'équilibre fragile",
    subtitle: "Un encerclement peut faire basculer la ligne.",
    chapter: "II · RÉSEAUX D'INFLUENCE",
    depth: 2,
    rocks: [10, 15],
    sanctuaries: [7, 14],
  },
  {
    title: "Les quatre sanctuaires",
    subtitle: "Le terrain ne se résume pas au nombre de cases.",
    chapter: "II · RÉSEAUX D'INFLUENCE",
    depth: 2,
    rocks: [2, 14],
    sanctuaries: [8, 10],
  },
  {
    title: "La fracture",
    subtitle: "Défendre un passage ou contourner l'ennemi ?",
    chapter: "III · GUERRE DE POSITION",
    depth: 3,
    rocks: [9, 14, 16],
    sanctuaries: [7, 19],
  },
  {
    title: "La longue marche",
    subtitle: "L'adversaire anticipe désormais tes réponses.",
    chapter: "III · GUERRE DE POSITION",
    depth: 3,
    rocks: [3, 15, 10],
    sanctuaries: [13, 8],
  },
  {
    title: "Le dernier bastion",
    subtitle: "Chaque sanctuaire gagné peut coûter deux terres.",
    chapter: "IV · LE GRAND DÉTOUR",
    depth: 3,
    rocks: [4, 9, 16],
    sanctuaries: [8, 13],
  },
  {
    title: "La lisière",
    subtitle: "La meilleure expansion est parfois une défense.",
    chapter: "IV · LE GRAND DÉTOUR",
    depth: 3,
    rocks: [2, 10, 15, 13],
    sanctuaries: [7, 16],
  },
] as const;

export const stages: readonly Stage[] = designs.map((design, index) => ({
  id: `lisiere-${String(index + 1).padStart(2, "0")}`,
  title: design.title,
  subtitle: design.subtitle,
  chapter: design.chapter,
  depth: design.depth,
  rocks: symmetric(design.rocks),
  sanctuaries: symmetric(design.sanctuaries).filter(
    (cell) => !symmetric(design.rocks).includes(cell),
  ),
}));

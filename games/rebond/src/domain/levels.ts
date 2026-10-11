import { BALL_RADIUS, project } from "./physics";
import type { Bumper, Level, Vec2 } from "./types";

/**
 * Each reference launch follows every numbered relay in order, then enters
 * the goal. Distances and collisions are simulated by the same domain engine
 * used by real gameplay; tests replay all 18 reference launches.
 */
type MarkerSpec = readonly [
  atSeconds: number,
  side: -1 | 1,
  contactRatio: number,
];
type StoneSpec = readonly [x: number, y: number, radius: number];
type Design = readonly [
  title: string,
  subtitle: string,
  angle: number,
  speed: number,
  goalTime: number,
  relays: readonly MarkerSpec[],
  stones: readonly StoneSpec[],
];

const source: Vec2 = { x: 145, y: 440 };

const designs: readonly Design[] = [
  [
    "Premier ricochet",
    "La cible ne s'ouvre qu'après un rebond.",
    36,
    740,
    0.84,
    [[0.45, -1, 0.66]],
    [],
  ],
  [
    "Le bon contact",
    "Vise le cercle numéroté, pas l'arrivée.",
    67,
    540,
    0.66,
    [[0.31, -1, 0.69]],
    [],
  ],
  [
    "Angle d'attaque",
    "La direction d'un choc change tout.",
    69,
    650,
    0.71,
    [[0.33, -1, 0.58]],
    [],
  ],
  [
    "Le chemin courbe",
    "Trouve la trajectoire qui active la porte.",
    33,
    680,
    0.76,
    [[0.4, -1, 0.53]],
    [],
  ],
  [
    "Premier obstacle",
    "Un rocher coupe les fausses pistes.",
    41,
    660,
    1.22,
    [[0.57, 1, 0.55]],
    [[172.9, 307.4, 22]],
  ],
  [
    "La séquence",
    "Deux chocs, dans le bon ordre.",
    32,
    630,
    1.49,
    [
      [0.39, -1, 0.55],
      [0.84, -1, 0.76],
    ],
    [[422.1, 436, 22]],
  ],
  [
    "Double détour",
    "Chaque rebond prépare le suivant.",
    26,
    660,
    1.44,
    [
      [0.54, 1, 0.62],
      [0.95, -1, 0.47],
    ],
    [[348.4, 425.8, 22]],
  ],
  [
    "La bifurcation",
    "Un obstacle t'oblige à contourner.",
    38,
    710,
    1.48,
    [
      [0.31, 1, 0.64],
      [0.82, -1, 0.62],
    ],
    [[214.6, 323.6, 22]],
  ],
  [
    "Effet miroir",
    "Observe où la bille revient.",
    64,
    510,
    1.34,
    [
      [0.36, 1, 0.56],
      [0.91, 1, 0.49],
    ],
    [],
  ],
  [
    "Le piège central",
    "Le plus court chemin est le mauvais.",
    48,
    570,
    1.21,
    [
      [0.54, 1, 0.69],
      [0.88, -1, 0.64],
    ],
    [[248.7, 285, 22]],
  ],
  [
    "Évitement",
    "Deux rochers troublent la trajectoire.",
    60,
    750,
    1.51,
    [
      [0.52, 1, 0.44],
      [1.06, -1, 0.69],
    ],
    [
      [261.3, 348.3, 22],
      [317, 304.4, 24],
    ],
  ],
  [
    "La chaîne",
    "Active trois points successifs.",
    31,
    530,
    2.11,
    [
      [0.53, -1, 0.57],
      [1.01, 1, 0.78],
      [1.57, 1, 0.52],
    ],
    [[248.9, 472.9, 22]],
  ],
  [
    "Contretemps",
    "La bonne route passe par trois chocs.",
    67,
    680,
    2.15,
    [
      [0.49, -1, 0.49],
      [0.93, -1, 0.69],
      [1.46, 1, 0.74],
    ],
    [[367.7, 330, 22]],
  ],
  [
    "Le labyrinthe",
    "Les rochers créent de faux raccourcis.",
    64,
    790,
    2.03,
    [
      [0.32, 1, 0.62],
      [0.82, 1, 0.52],
      [1.35, -1, 0.56],
    ],
    [
      [296.7, 405.2, 22],
      [493, 440.5, 24],
    ],
  ],
  [
    "Triple réflexion",
    "Il faut anticiper la troisième déviation.",
    49,
    570,
    1.85,
    [
      [0.52, -1, 0.48],
      [1.06, -1, 0.54],
      [1.53, 1, 0.67],
    ],
    [
      [351.5, 397.9, 22],
      [433.1, 381.3, 24],
    ],
  ],
  [
    "Le grand écart",
    "Un autre angle ouvre le passage.",
    45,
    700,
    2.1,
    [
      [0.39, -1, 0.47],
      [0.87, 1, 0.64],
      [1.41, -1, 0.57],
    ],
    [],
  ],
  [
    "Quatre impulsions",
    "La moindre erreur change toute la suite.",
    44,
    540,
    2.5,
    [
      [0.38, -1, 0.48],
      [0.88, -1, 0.68],
      [1.31, -1, 0.73],
      [1.81, 1, 0.63],
    ],
    [
      [325.5, 417.3, 22],
      [439.1, 460.1, 24],
      [444.2, 385.3, 26],
    ],
  ],
  [
    "La trajectoire impossible",
    "Quatre rebonds, aucun raccourci.",
    36,
    780,
    2.1,
    [
      [0.34, -1, 0.66],
      [0.78, -1, 0.61],
      [1.35, 1, 0.51],
      [1.8, 1, 0.76],
    ],
    [
      [322.4, 466.3, 22],
      [453.3, 379.6, 24],
    ],
  ],
];

const chapters = [
  "01 · APPRENDRE À RICOCHER",
  "02 · DEUX REBONDS EN CHAÎNE",
  "03 · LES TRIPLES DÉTOURS",
  "04 · LA TRAJECTOIRE MAÎTRISÉE",
] as const;

function placeRelay(
  angle: number,
  speed: number,
  existing: readonly Bumper[],
  at: number,
  side: -1 | 1,
  ratio: number,
  radius: number,
  id: string,
): Bumper {
  const ball = project(source, angle, speed, existing, at);
  const velocity = Math.hypot(ball.vx, ball.vy);
  if (velocity < 1) throw new Error("Reference launch has stalled");
  const offset = (radius + BALL_RADIUS) * ratio;
  return {
    id,
    radius,
    x: ball.x + (-ball.vy / velocity) * side * offset,
    y: ball.y + (ball.vx / velocity) * side * offset,
  };
}

export const levels: readonly Level[] = designs.map((design, index) => {
  const [title, subtitle, angle, speed, goalTime, relays, stones] = design;
  const bumpers: Bumper[] = [];
  const required: string[] = [];
  for (const [at, side, ratio] of relays) {
    const id = `b${required.length + 1}`;
    const radius = [26, 24, 24, 22][Math.min(required.length, 3)]!;
    bumpers.push(
      placeRelay(angle, speed, bumpers, at, side, ratio, radius, id),
    );
    required.push(id);
  }
  for (const [x, y, radius] of stones) {
    bumpers.push({
      id: `s${bumpers.length - required.length + 1}`,
      x,
      y,
      radius,
    });
  }
  const position = project(source, angle, speed, bumpers, goalTime);
  return {
    id: `rebond-${String(index + 1).padStart(2, "0")}`,
    title,
    subtitle,
    chapter: chapters[index < 5 ? 0 : index < 11 ? 1 : index < 16 ? 2 : 3]!,
    source,
    goal: { x: position.x, y: position.y },
    goalRadius: Math.max(22, 36 - Math.floor(index / 2) * 2),
    bumpers,
    required,
    reference: { angle, speed, time: goalTime },
  };
});

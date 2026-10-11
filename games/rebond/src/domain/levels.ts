import { project } from "./physics";
import type { Bumper, Level, Vec2 } from "./types";

type Design = Readonly<{
  title: string;
  subtitle: string;
  angle: number;
  speed: number;
  time: number;
  bumper?: Readonly<{ at: number; side: 1 | -1; offset: number; radius: number }>;
  second?: Readonly<{ at: number; side: 1 | -1; offset: number; radius: number }>;
}>;

const source: Vec2 = { x: 145, y: 440 };
const designs: readonly Design[] = [
  { title: "Premier élan", subtitle: "Le voyage commence par un glissement.", angle: 38, speed: 570, time: 0.91 },
  { title: "Sous la surface", subtitle: "La gravité dessine la courbe.", angle: 58, speed: 640, time: 0.96 },
  { title: "Plus loin", subtitle: "La force change tout.", angle: 28, speed: 680, time: 0.95 },
  { title: "Une autre hauteur", subtitle: "Ajuste les degrés du ciel.", angle: 72, speed: 575, time: 1.08 },
  { title: "Premier ricochet", subtitle: "Une rencontre change la direction.", angle: 43, speed: 615, time: 1.42, bumper: { at: 0.58, side: -1, offset: 15, radius: 25 } },
  { title: "La pierre claire", subtitle: "Anticipe la déviation.", angle: 54, speed: 650, time: 1.55, bumper: { at: 0.62, side: 1, offset: 18, radius: 24 } },
  { title: "Équilibre", subtitle: "Un petit angle, un nouvel horizon.", angle: 30, speed: 715, time: 1.3, bumper: { at: 0.56, side: -1, offset: 17, radius: 29 } },
  { title: "Sous pression", subtitle: "Les trajectoires n'ont pas de mémoire.", angle: 63, speed: 630, time: 1.54, bumper: { at: 0.67, side: 1, offset: 18, radius: 28 } },
  { title: "Au ras du mur", subtitle: "Utilise les limites à ton avantage.", angle: 24, speed: 760, time: 1.62 },
  { title: "Bascule", subtitle: "L'effet vient après le contact.", angle: 48, speed: 692, time: 1.7, bumper: { at: 0.52, side: -1, offset: 20, radius: 27 } },
  { title: "La constellation", subtitle: "Cherche les passages improbables.", angle: 70, speed: 715, time: 1.74, bumper: { at: 0.71, side: 1, offset: 20, radius: 27 } },
  { title: "Le rebord", subtitle: "Un rebond peut en cacher un autre.", angle: 38, speed: 755, time: 1.75, bumper: { at: 0.69, side: -1, offset: 18, radius: 30 } },
  { title: "À contre-courant", subtitle: "Même les limites font partie du jeu.", angle: 56, speed: 700, time: 1.78, bumper: { at: 0.67, side: 1, offset: 21, radius: 31 } },
  { title: "Clair-obscur", subtitle: "La précision remplace la vitesse.", angle: 42, speed: 790, time: 1.93, bumper: { at: 0.61, side: -1, offset: 19, radius: 27 } },
  { title: "Double reflet", subtitle: "Deux chemins, un seul résultat.", angle: 67, speed: 745, time: 2.08, bumper: { at: 0.66, side: 1, offset: 17, radius: 27 }, second: { at: 1.23, side: -1, offset: 19, radius: 25 } },
  { title: "Fragmentation", subtitle: "Une bille, plusieurs destinées.", angle: 31, speed: 760, time: 1.9, bumper: { at: 0.5, side: -1, offset: 18, radius: 24 }, second: { at: 1.2, side: 1, offset: 20, radius: 24 } },
  { title: "La boucle", subtitle: "Le meilleur trajet est rarement droit.", angle: 61, speed: 775, time: 2.2, bumper: { at: 0.62, side: 1, offset: 16, radius: 26 }, second: { at: 1.42, side: -1, offset: 19, radius: 29 } },
  { title: "Dernière lumière", subtitle: "Tu connais maintenant le langage des rebonds.", angle: 47, speed: 790, time: 2.05, bumper: { at: 0.6, side: -1, offset: 16, radius: 30 }, second: { at: 1.24, side: 1, offset: 18, radius: 26 } },
];

function bumperAt(
  angle: number,
  speed: number,
  bumper: NonNullable<Design["bumper"]>,
  existing: readonly Bumper[],
  id: string,
): Bumper {
  const ball = project(source, angle, speed, existing, bumper.at);
  const velocity = Math.hypot(ball.vx, ball.vy) || 1;
  const dx = (-ball.vy / velocity) * bumper.side * bumper.offset;
  const dy = (ball.vx / velocity) * bumper.side * bumper.offset;
  return {
    id,
    x: ball.x + dx,
    y: ball.y + dy,
    radius: bumper.radius,
  };
}

const chapters = [
  "01 · PRENDRE SON ÉLAN",
  "02 · L'ART DU RICOCHET",
  "03 · LES LIMITES",
  "04 · LA MAÎTRISE",
] as const;

export const levels: readonly Level[] = designs.map((design, index) => {
  const bumpers: Bumper[] = [];
  if (design.bumper) bumpers.push(bumperAt(design.angle, design.speed, design.bumper, bumpers, "b1"));
  if (design.second) bumpers.push(bumperAt(design.angle, design.speed, design.second, bumpers, "b2"));
  const position = project(source, design.angle, design.speed, bumpers, design.time);
  return {
    id: `rebond-${String(index + 1).padStart(2, "0")}`,
    title: design.title,
    subtitle: design.subtitle,
    chapter: chapters[Math.min(3, Math.floor(index / 5))]!,
    source,
    goal: { x: position.x, y: position.y },
    goalRadius: Math.max(22, 39 - Math.floor(index / 3) * 2),
    bumpers,
    reference: { angle: design.angle, speed: design.speed, time: design.time },
  };
});

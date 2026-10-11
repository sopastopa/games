import type { Chapter } from "./types";
import { COURSES } from "./courses";

type Story = Omit<
  Chapter,
  "speed" | "airJump" | "lesson" | "concept" | "winds" | "obstacles"
> & {
  obstacles: readonly { x: number; width: number }[];
};

const STORIES: readonly Story[] = [
  {
    id: "rose",
    number: "01",
    title: "Le matin à l'envers",
    place: "LES TOITS DE ROSE",
    motif: "flowers",
    colorName: "le rose",
    opening:
      "À Roselune, les toits ont perdu leur couleur. Pip, une petite goutte de lumière, trouve une lettre : « Si tu entends encore les couleurs, viens. »",
    middle:
      "Dans une fenêtre, une fleur rose se réveille. La lettre est signée : Mima, la vieille gardienne du ciel.",
    ending:
      "Le rose revient sur les toits. Une voix souffle : « Ce n'est pas le ciel qui a oublié. C'est nous. » Pip suit la piste.",
    palette: {
      sky: "#ff78b3",
      horizon: "#ffd09d",
      ground: "#c63e80",
      hill: "#fa65a4",
      hillFar: "#f9a5bc",
      ink: "#742451",
      glow: "#ffe76e",
      companion: "#fff7e6",
    },
    endX: 1550,
    checkpoint: 780,
    obstacles: [
      { x: 530, width: 48 },
      { x: 1110, width: 55 },
    ],
    sparks: [
      { x: 280, y: 320 },
      { x: 650, y: 285 },
      { x: 1280, y: 305 },
    ],
  },
  {
    id: "orange",
    number: "02",
    title: "La rue des lampions",
    place: "LE GRAND CARNAVAL",
    motif: "lanterns",
    colorName: "l'orange",
    opening:
      "Pip arrive au carnaval. Sans orange, les lanternes sont froides et les musiciens jouent en silence.",
    middle:
      "Une petite fanfare le reconnaît : « Mima disait que chaque couleur a besoin d'être partagée, pas enfermée. »",
    ending:
      "Les lanternes s'allument une à une. Les musiciens retrouvent leur mélodie. Pip découvre une deuxième lettre cachée sous l'estrade.",
    palette: {
      sky: "#ff934f",
      horizon: "#ffe7a5",
      ground: "#a94065",
      hill: "#ff8c82",
      hillFar: "#ffcc8d",
      ink: "#713352",
      glow: "#faff8a",
      companion: "#fff0bf",
    },
    endX: 1800,
    checkpoint: 900,
    obstacles: [
      { x: 440, width: 48 },
      { x: 730, width: 46 },
      { x: 1220, width: 60 },
      { x: 1510, width: 50 },
    ],
    sparks: [
      { x: 270, y: 315 },
      { x: 1020, y: 303 },
      { x: 1610, y: 292 },
    ],
  },
  {
    id: "jaune",
    number: "03",
    title: "La boulangerie du soleil",
    place: "LE MARCHÉ CITRON",
    motif: "candy",
    colorName: "le jaune",
    opening:
      "Le marché est gris. Dans la boulangerie, les brioches ne lèvent plus. Pip promet au boulanger d'aller chercher un rayon.",
    middle:
      "Sur les étals, Pip trouve un carnet : « J'ai voulu garder une aurore pour moi seule. J'ai brisé son prisme. »",
    ending:
      "Le marché devient un océan de jaune. Le boulanger sourit, mais Pip comprend enfin : Mima n'a pas volé les couleurs. Elle a fait une erreur.",
    palette: {
      sky: "#ffe66a",
      horizon: "#fff3b5",
      ground: "#db7748",
      hill: "#ffba5e",
      hillFar: "#ffe58a",
      ink: "#924f3e",
      glow: "#ffffff",
      companion: "#fff3dd",
    },
    endX: 1900,
    checkpoint: 970,
    obstacles: [
      { x: 410, width: 52 },
      { x: 695, width: 52 },
      { x: 1160, width: 52 },
      { x: 1430, width: 60 },
      { x: 1650, width: 42 },
    ],
    sparks: [
      { x: 320, y: 310 },
      { x: 840, y: 285 },
      { x: 1530, y: 295 },
    ],
  },
  {
    id: "vert",
    number: "04",
    title: "La forêt qui murmure",
    place: "LES ARBRES MENTHE",
    motif: "forest",
    colorName: "le vert",
    opening:
      "La forêt a cessé de pousser. Les arbres attendent une chanson que personne ne connaît. Pip avance sous une voûte de feuilles.",
    middle:
      "Les feuilles lui soufflent : « Une couleur seule éclaire. Ensemble, elles inventent des mondes. » Pip se souvient du rire de Mima.",
    ending:
      "Les arbres explosent en feuilles menthe. À l'horizon, une mer attend. Les lettres conduisent toutes au phare.",
    palette: {
      sky: "#64dbac",
      horizon: "#c9f7c0",
      ground: "#348d80",
      hill: "#59bb94",
      hillFar: "#9ae1a4",
      ink: "#155e6d",
      glow: "#fff3a2",
      companion: "#f6ffe5",
    },
    endX: 2000,
    checkpoint: 1000,
    obstacles: [
      { x: 420, width: 52 },
      { x: 665, width: 57 },
      { x: 1180, width: 64 },
      { x: 1450, width: 52 },
      { x: 1700, width: 62 },
    ],
    sparks: [
      { x: 275, y: 315 },
      { x: 910, y: 310 },
      { x: 1575, y: 285 },
    ],
  },
  {
    id: "bleu",
    number: "05",
    title: "Les lettres à la mer",
    place: "L'OCÉAN BLEU",
    motif: "sea",
    colorName: "le bleu",
    opening:
      "Au bord du monde, l'océan est transparent. Le phare ne brille plus. Pip trouve sur le sable une enveloppe mouillée.",
    middle:
      "C'est la voix de Mima : « J'avais peur que l'aube disparaisse. Alors je l'ai cachée dans un prisme, et il s'est brisé. »",
    ending:
      "Les vagues se teintent de bleu. La lumière du phare se rallume et désigne la montagne violette, où Mima attend depuis longtemps.",
    palette: {
      sky: "#53bff9",
      horizon: "#c2f9fb",
      ground: "#3479c8",
      hill: "#44a8eb",
      hillFar: "#81dcf2",
      ink: "#1a4788",
      glow: "#fff59b",
      companion: "#effffd",
    },
    endX: 2150,
    checkpoint: 1030,
    obstacles: [
      { x: 435, width: 48 },
      { x: 730, width: 66 },
      { x: 1190, width: 54 },
      { x: 1500, width: 66 },
      { x: 1830, width: 60 },
    ],
    sparks: [
      { x: 315, y: 300 },
      { x: 985, y: 290 },
      { x: 1720, y: 295 },
    ],
  },
  {
    id: "violet",
    number: "06",
    title: "La gardienne des étoiles",
    place: "LA MONTAGNE VIOLETTE",
    motif: "night",
    colorName: "le violet",
    opening:
      "Au sommet, la nuit est pleine d'étoiles éteintes. Mima est là, immobile, près des morceaux du prisme.",
    middle:
      "Mima murmure : « J'ai voulu retenir la plus belle aurore. J'ai oublié qu'une lumière doit continuer son chemin. »",
    ending:
      "Pip lui tend sa petite lumière. Mima accepte enfin de laisser partir le ciel. Ensemble, ils montent vers le dernier morceau.",
    palette: {
      sky: "#653fc8",
      horizon: "#ec8fe8",
      ground: "#55409c",
      hill: "#805cc8",
      hillFar: "#bc7ada",
      ink: "#2a285f",
      glow: "#fff6a1",
      companion: "#ffe0ff",
    },
    endX: 2250,
    checkpoint: 1110,
    obstacles: [
      { x: 430, width: 56 },
      { x: 700, width: 64 },
      { x: 985, width: 52 },
      { x: 1430, width: 62 },
      { x: 1720, width: 66 },
      { x: 1980, width: 57 },
    ],
    sparks: [
      { x: 300, y: 300 },
      { x: 1250, y: 288 },
      { x: 1880, y: 295 },
    ],
  },
  {
    id: "aurore",
    number: "07",
    title: "Un ciel pour tout le monde",
    place: "LA FABRIQUE DES AURORES",
    motif: "rainbow",
    colorName: "toutes les couleurs",
    opening:
      "Les sept chemins se rejoignent au-dessus des nuages. Pip et Mima arrivent à la fabrique. Il ne manque qu'un dernier geste.",
    middle:
      "La fabrique s'éveille. Les couleurs ne veulent pas rester rangées : elles dansent, se mélangent et traversent le ciel.",
    ending:
      "L'aurore est de retour. Mima n'essaie plus de l'enfermer. Pip rentre chez lui sous un ciel qui change chaque matin. FIN — Et demain, de nouvelles couleurs.",
    palette: {
      sky: "#9c75ff",
      horizon: "#ffb6d9",
      ground: "#6f62c9",
      hill: "#f08bc9",
      hillFar: "#8adce8",
      ink: "#493377",
      glow: "#fff9ac",
      companion: "#ffffff",
    },
    endX: 2400,
    checkpoint: 1200,
    obstacles: [
      { x: 410, width: 55 },
      { x: 680, width: 58 },
      { x: 950, width: 60 },
      { x: 1370, width: 66 },
      { x: 1610, width: 54 },
      { x: 1890, width: 60 },
      { x: 2170, width: 55 },
    ],
    sparks: [
      { x: 315, y: 298 },
      { x: 1130, y: 290 },
      { x: 2070, y: 280 },
    ],
  },
];

export const CHAPTERS: readonly Chapter[] = STORIES.map((story, index) => ({
  ...story,
  ...COURSES[index]!,
}));

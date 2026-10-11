import type { Sector } from "./types";

export const SECTORS: readonly Sector[] = [
  {
    title: "Le premier signal",
    region: "I · Les profondeurs",
    clue: "Les lumières s'allument sous les maisons vides.",
    chronicle:
      "Un message court traverse les eaux : « Nous n'avons pas fui. Nous avons attendu. »",
    accent: "#7fdfcc",
  },
  {
    title: "La galerie des cartes",
    region: "I · Les profondeurs",
    clue: "Des routes furent effacées des registres.",
    chronicle:
      "Les plans ne décrivent pas des rues : ils dessinent les chemins de la mémoire.",
    accent: "#84c8e8",
  },
  {
    title: "Les machines dormantes",
    region: "I · Les profondeurs",
    clue: "La cité respire encore, lentement.",
    chronicle:
      "Les ingénieurs avaient confié le rythme de la ville à des machines capables d'apprendre.",
    accent: "#a5e0ab",
  },
  {
    title: "Le quai renversé",
    region: "I · Les profondeurs",
    clue: "Les navires pointaient vers la terre.",
    chronicle:
      "Ils n'avaient pas prévu la mer : c'est la ville qui a choisi de descendre.",
    accent: "#f2c583",
  },
  {
    title: "Les jardins sous verre",
    region: "II · La mémoire vive",
    clue: "Une serre nourrit encore les courants.",
    chronicle:
      "Les plantes conservent les voix de celles et ceux qui les ont cultivées.",
    accent: "#b9df91",
  },
  {
    title: "Le conservatoire",
    region: "II · La mémoire vive",
    clue: "Chaque porte conserve une mélodie.",
    chronicle:
      "Une chanson entière devient audible quand les fragments sont réunis.",
    accent: "#e7b4d8",
  },
  {
    title: "Le parlement silencieux",
    region: "II · La mémoire vive",
    clue: "Personne ne prit la dernière décision seul.",
    chronicle:
      "Le grand départ fut voté. Les habitants avaient peur du monde qui montait au-dessus d'eux.",
    accent: "#e9bd8c",
  },
  {
    title: "La tour de calcul",
    region: "II · La mémoire vive",
    clue: "Les sentinelles protègent une question.",
    chronicle:
      "Les machines furent conçues pour préserver des choix, pas pour garder des richesses.",
    accent: "#9cbce8",
  },
  {
    title: "La fissure bleue",
    region: "III · L'aube enfouie",
    clue: "Le ciel pénètre les fondations.",
    chronicle:
      "La frontière entre la mer et l'air n'était plus qu'une convention.",
    accent: "#7cdadf",
  },
  {
    title: "Les voix du large",
    region: "III · L'aube enfouie",
    clue: "Une réponse voyage en sens inverse.",
    chronicle:
      "Des communautés de la surface appellent encore les habitants de la ville engloutie.",
    accent: "#b7b3f1",
  },
  {
    title: "Le phare intérieur",
    region: "III · L'aube enfouie",
    clue: "Toutes les balises convergent vers un lieu.",
    chronicle:
      "La ville ne demandait pas à être sauvée : elle souhaitait être entendue.",
    accent: "#f7ca8d",
  },
  {
    title: "La porte des marées",
    region: "III · L'aube enfouie",
    clue: "La dernière décision appartient à l'explorateur.",
    chronicle:
      "Les archives proposent deux futurs : remonter la cité ou établir un passage entre les deux mondes. Rien n'est effacé.",
    accent: "#a4ebcc",
  },
];

export const ROLES = {
  scout: {
    title: "Éclaireur",
    description: "Voit plus loin · impulsion de 3 cases",
    hull: 5,
    scanCost: 1,
    dashDistance: 3,
  },
  engineer: {
    title: "Ingénieure",
    description: "Énergie supplémentaire · recharge améliorée",
    hull: 5,
    scanCost: 1,
    dashDistance: 2,
  },
  guardian: {
    title: "Gardien",
    description: "Coque renforcée · approche prudente",
    hull: 8,
    scanCost: 2,
    dashDistance: 2,
  },
} as const;

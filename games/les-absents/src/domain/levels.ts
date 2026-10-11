import type { Level, Node, Role } from "./types";

const coordinates: readonly string[] = [
  "35,15;52,53;35,40;76,75;84,17;73,17;60,25;50,76;21,51;55,67;39,73",
  "67,82;13,33;36,68;88,56;81,14;33,16;55,77;76,36;15,59;48,64;42,45",
  "65,54;88,21;77,54;25,33;34,21;84,73;76,85;54,24;19,72;42,63;51,79",
  "83,32;38,23;76,42;71,58;78,65;85,51;67,30;75,31;14,40;21,70;45,78",
  "64,31;49,42;29,27;62,84;34,53;64,41;78,35;19,47;88,77;35,37;13,32;83,24",
  "45,17;37,52;24,53;74,43;64,41;53,58;15,45;44,25;26,35;66,32;83,27;71,84",
  "50,24;79,76;66,51;20,78;52,53;18,27;49,14;12,40;34,48;48,43;34,63;67,36",
  "54,82;25,83;70,45;17,49;86,62;27,74;78,75;37,72;39,62;24,33;16,66;53,66",
  "49,46;17,59;34,81;42,23;69,61;46,55;42,65;18,40;79,60;13,72;18,79;61,17;36,41",
  "16,71;20,82;86,84;46,51;18,22;41,44;82,19;39,64;32,80;48,16;45,73;64,18;53,59",
  "31,29;52,60;50,74;24,84;69,40;27,61;16,77;71,70;43,34;32,75;12,21;87,22;42,83",
  "17,48;67,53;49,32;25,71;34,84;54,55;61,14;82,53;22,33;34,57;26,50;87,73;40,78",
  "72,45;26,80;65,51;69,77;80,68;59,37;76,86;18,64;25,52;70,24;57,67;86,57;43,21;44,50",
  "40,69;60,60;37,21;85,15;87,85;53,55;80,46;31,75;73,25;56,82;69,41;26,59;81,37;46,75",
  "54,28;82,69;85,84;22,60;44,32;52,86;29,76;76,58;67,61;39,23;78,76;57,52;88,24;18,47",
  "50,29;72,41;22,33;53,53;30,31;36,56;54,39;75,72;49,70;14,65;45,86;69,53;45,63;85,70",
  "47,78;72,69;56,24;12,29;53,34;38,82;37,41;37,53;61,48;61,61;27,81;55,76;46,19;18,47;34,68",
  "76,41;71,79;70,14;43,32;80,14;28,39;51,32;48,86;33,77;87,75;22,26;31,59;58,82;77,30;73,62",
  "53,75;74,30;83,74;22,40;65,18;59,40;53,61;31,49;88,53;21,73;70,49;49,83;67,80;45,74;88,25",
  "59,64;73,61;74,23;27,70;70,76;35,51;80,68;46,44;36,84;35,14;65,33;17,61;42,62;50,67;66,21",
  "75,33;27,46;26,20;34,66;25,35;46,73;87,42;52,44;46,82;47,58;41,35;61,79;79,82;13,15;54,72;79,58",
  "30,67;57,75;14,59;60,22;85,22;81,61;71,82;38,27;88,69;51,47;88,14;22,15;17,51;61,59;64,50;53,36",
  "16,75;16,33;63,85;69,71;52,73;68,14;54,55;45,21;58,44;38,47;64,52;76,33;20,42;77,86;19,53;79,65",
  "45,40;62,47;77,72;44,76;74,84;63,39;20,41;48,59;58,25;23,19;19,73;28,35;43,49;80,43;36,44;78,29",
];

const titles: readonly (readonly [string, string])[] = [
  ["Le premier vide", "Un fil nouveau apparaît."],
  ["Le détour", "Ce qui sépare peut rapprocher."],
  ["L'intervalle", "Observe les distances invisibles."],
  ["La marge", "Une seule absence suffit."],
  ["Un effet en cascade", "Deux décisions liées."],
  ["L'angle mort", "Ce qui semble proche ne l'est pas toujours."],
  ["Entre les lignes", "Le réseau choisit ses propres routes."],
  ["L'écho", "Une connexion réveille une autre."],
  ["La rupture douce", "Défaire pour réunir."],
  ["Au-delà du voisin", "Deux absences, un seul chemin."],
  ["Le prix du lien", "Tout rapprocher n'est pas tout relier."],
  ["Trois silences", "Choisis les bonnes absences."],
  ["La faille", "Les ramifications se recomposent."],
  ["Le passage", "Préserve l'équilibre."],
  ["Le point fragile", "Un retrait peut tout changer."],
  ["L'invisible", "Anticipe les nouvelles distances."],
  ["Contre-intuition", "Le chemin direct n'est pas le bon."],
  ["L'équilibre instable", "Trois absences exactement."],
  ["L'autre réseau", "Chaque connexion a un coût."],
  ["Résonances", "Plusieurs mondes possibles."],
  ["La ligne de fuite", "Quatre absences nécessaires."],
  ["Sans retour", "Ce que tu retires donne forme au reste."],
  ["L'ultime écart", "Pense à l'ensemble du réseau."],
  ["Constellation négative", "L'art d'atteindre sans alimenter le danger."],
];

const chapters = [
  "I · Les premières absences",
  "II · Les effets secondaires",
  "III · Les sacrifices",
  "IV · Les paradoxes",
] as const;

function parseNodes(coordinatesList: string): Node[] {
  return coordinatesList.split(";").map((point, index) => {
    const [x, y] = point.split(",").map(Number);
    const role: Role =
      index === 0
        ? "source"
        : index === 1 || index === 2
          ? "receiver"
          : index === 3
            ? "hazard"
            : "neutral";
    const id =
      index === 0
        ? "source"
        : index === 1
          ? "target-a"
          : index === 2
            ? "target-b"
            : index === 3
              ? "danger"
              : `n${index - 3}`;
    return { id, x: x!, y: y!, role };
  });
}

export const levels: readonly Level[] = coordinates.map((data, index) => {
  const par = index < 4 ? 1 : index < 10 ? 2 : index < 18 ? 3 : 4;
  const chapter =
    index < 4
      ? chapters[0]
      : index < 10
        ? chapters[1]
        : index < 18
          ? chapters[2]
          : chapters[3];
  const [title, subtitle] = titles[index]!;
  return {
    id: `level-${String(index + 1).padStart(2, "0")}`,
    title,
    subtitle,
    chapter,
    par,
    nodes: parseNodes(data),
  };
});

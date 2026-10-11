# Les Absents — règles spécifiques

- Garder `src/domain/graph.ts` et `solver.ts` purs et indépendants du navigateur.
- Un nœud présent choisit son voisin présent le plus proche ; les liens ainsi créés sont bidirectionnels.
- En cas de distances identiques, départager par identifiant lexicographique.
- Seuls les nœuds neutres peuvent être retirés ; source, récepteurs et danger sont permanents.
- Un niveau est résolu si les deux récepteurs sont alimentés et le danger ne l'est pas.
- Aucun mécanisme de hasard, de minuteur ou de perte : le jeu est purement réfléchi.
- Conserver les 24 niveaux validés par le solveur et les budgets minimaux des niveaux.
- Tous les gestes sont disponibles au clavier et à la souris ou au toucher ; les nœuds neutres sont des boutons.
- Le portail et le code des autres jeux ne doivent pas être modifiés.
- Exiger tests du solveur, règles, historique, persistance, navigation et publication.

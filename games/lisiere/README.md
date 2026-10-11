# LISIÈRE

Un duel de stratégie minimaliste au tour par tour contre un adversaire déterministe.

## Règles

1. **Un clic = une conquête.** Choisir une case libre orthogonalement voisine d'au moins une de ses terres.
2. Si un territoire adverse (hors capitale) possède **au moins deux voisins de ta couleur** après ton placement, il passe dans ton camp. Plusieurs territoires peuvent basculer simultanément.
3. Les sanctuaires marqués d'un losange valent **3 points** ; les terres ordinaires valent **1 point** ; les falaises restent infranchissables.
4. Quand personne ne peut plus s'étendre, celui qui contrôle le plus de points remporte la carte. Une faction sans mouvement passe automatiquement son tour.
5. Après une victoire, une nouvelle région se débloque, avec une IA plus calculatrice.

## Commandes

- Cliquer, toucher ou utiliser Tab + Entrée/Espace sur une case jouable.
- Annuler le dernier tour complet (ton coup et la réponse éventuelle de l'IA).
- Recommencer la région, ou choisir une région débloquée.
- Revenir au catalogue avec « Tous les jeux ».

Le jeu ne contient ni chronomètre ni récompense aléatoire. La progression est enregistrée localement sous `games:lisiere:progress-v1`.

## Structure

- `src/domain/` : modèle de grille, captures, score, conditions terminales, recherche adversaire.
- `src/application/` : orchestration, historique, IA asynchrone via port de planification, progression.
- `src/infrastructure/` : ports du navigateur, gestion des sauvegardes.
- `src/presentation/` : interface DOM accessible et responsive.
- `tests/unit/` : règles métier, minimax, contrôleur et invariants de cartes.
- `tests/e2e/lisiere.spec.ts` : entrée depuis le portail, tour de jeu, annulation et navigation.

URL : https://sopastopa.github.io/games/play/lisiere/

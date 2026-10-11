# Les Absents

**Le jeu où retirer un point peut reconnecter un univers.**

Un puzzle de graphe géométrique, sans temps limite, contenant 24 niveaux conçus hors ligne et vérifiés par un solveur exhaustif.

## Règles

Chaque nœud visible sélectionne son voisin visible le plus proche. Cette sélection crée une connexion bidirectionnelle. La source émeraude alimente tout nœud atteignable à travers le réseau. Les deux récepteurs bleus doivent être alimentés ; le danger corail ne doit pas l'être. On peut uniquement faire disparaître les nœuds neutres blancs, jusqu'à la limite du niveau. Un clic sur un fantôme restaure ce nœud.

Le nombre de retraits maximal est aussi le minimum prouvé par le solveur exhaustif. Aucun clic inutile n'est nécessaire. Toutes les égalités de distances sont départagées par ID, rendant le résultat déterministe.

## Jouer

- Cliquer ou utiliser Tab + Entrée/Espace sur les nœuds neutres pour retirer ou restaurer.
- Annuler, rétablir, recommencer et demander un indice sans limite.
- Sélectionner un niveau débloqué et passer au niveau suivant une fois la solution trouvée.
- La progression est conservée localement sous la clé `games:les-absents:progress-v1`.
- Le lien « Tous les jeux » ramène au portail.

## Architecture

- `src/domain/` : géométrie, propagation, conditions de victoire, solveur exhaustif et niveaux.
- `src/application/` : contrôleur, historique des mouvements, progression et ports.
- `src/infrastructure/` : adaptateur localStorage robuste.
- `src/presentation/` : SVG, animation et DOM accessible.
- `tests/unit/` : propriétés du graphe, 24 niveaux validés, cas limites et contrôleur.
- `tests/e2e/les-absents.spec.ts` : navigation et partie réelle avec Playwright.

URL : https://sopastopa.github.io/games/play/les-absents/

Développement : `pnpm --dir games/les-absents dev`. Contrôles : `pnpm verify`.

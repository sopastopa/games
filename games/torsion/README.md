# TORSION — l'art du quart de tour

Un puzzle de permutation à un seul geste et 12 ateliers à difficulté progressive.

## Règle

Cliquer sur un carré de **2 × 2 cases** fait tourner les quatre cases d'un quart de tour **horaire**. Déplacer chaque pièce numérotée jusqu'à sa cible portant le même numéro. Une cible ne se déplace jamais. Un carré contenant un rocher ne peut pas tourner. Les cases vides tournent aussi : elles constituent l'espace de manœuvre.

Les puzzles sont construits en partant d'une solution et en appliquant des tours inverses légaux : une solution existe toujours. Le nombre indiqué comme référence est celui de la construction et **pas un optimum garanti**. Aucun temps limite ni plafond de coups.

## Progression

1. Quart de tour et trajectoire d'une pièce.
2. Préparer une position en plusieurs tours.
3. Coordonner plusieurs pièces.
4. Utiliser les espaces vides et préserver les pièces placées.
5. Contourner les rochers et enchaîner des pivots interdépendants.

Chaque atelier enseigne une idée précise et ouvre le suivant. Les meilleurs nombres de tours sont enregistrés localement.

## Commandes

- Souris / toucher : choisir un bloc 2 × 2 en cliquant sur son coin supérieur gauche.
- Clavier : **Tab** pour naviguer entre les blocs, **Entrée** ou **Espace** pour tourner.
- **Annuler**, **Recommencer**, **Atelier suivant**, choix des ateliers déjà débloqués.
- **Tous les jeux** retourne au portail.

## Architecture

- domain : grilles, permutations, niveaux et victoire purs.
- application : transitions, historique et progression.
- infrastructure : adaptateur localStorage.
- presentation : DOM, états accessibles et CSS responsive.
- tests : Vitest pour la logique et les transitions ; Playwright pour le parcours réel.

URL : https://sopastopa.github.io/games/play/torsion/

## Principes de conception

Compétence, autonomie et feedback immédiat (Ryan, Rigby & Przybylski, 2006) ; objectifs et défis progressifs (Sweetser & Wyeth, 2005). Pas de comptes, achats, comptes à rebours, séries quotidiennes, publicité ni récompenses aléatoires.

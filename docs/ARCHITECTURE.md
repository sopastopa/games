# Architecture technique

## Principes
Le repository est un monorepo pnpm. Chaque jeu est compilé en application web statique isolée ; le portail n'importe aucun code des jeux. Aucun runtime partagé obligatoire (React ou moteur graphique) : Canvas, DOM, WebGL ou moteur peuvent être choisis jeu par jeu.

## Frontières pour un jeu
- **Domaine** : états, invariants, physique et règles métier pures ; aucune dépendance au navigateur.
- **Application** : cas d'usage, contrôleurs, ports de stockage/horloge/hasard, orchestration.
- **Infrastructure** : implémentation des ports via les API du navigateur, clés préfixées par jeu.
- **Présentation** : Canvas/DOM, événements, contrôles tactiles et accessibilité ; aucune logique métier.

La direction des dépendances est présentation → application → domaine ; infrastructure satisfait des interfaces définies par les couches internes et est branchée au point d'entrée.

## Contrat de catalogue
Chaque jeu possède `game.json` contenant au minimum `id` (identique au nom du dossier), `title`, `description`, `category`, `icon`, `accent`, `published`. Le script `build-site.mjs` valide tous les jeux et génère le catalogue publié. `published: false` exclut le jeu de la compilation de publication, mais les tests continuent de le couvrir.

## Chemins
Le portail est servi depuis `/games/` et chaque jeu depuis `/games/play/<slug>/`. Configurer le `base` Vite de chaque jeu. Le lien `../../` sur la racine du jeu pointe vers le portail. Les assets de chaque jeu sont compilés dans leur répertoire isolé.

## CI/CD
La PR est soumise aux vérifications de qualité. Sur la branche main, les contrôles doivent réussir avant l'assemblage dans `dist/`, puis GitHub Actions publie l'artefact entier en une opération GitHub Pages. Aucun serveur backend nécessaire. Ajouter une base de données distante ou un backend nécessitera une architecture supplémentaire.

# Instructions permanentes pour les agents de développement

## Mission et limites
- Un jeu = un dossier autonome sous `games/<slug>`, son propre package, son build, ses règles, ses ressources et ses tests.
- Ne jamais modifier le code d'un autre jeu pour en ajouter un. Le portail découvre les fichiers `game.json` au build.
- Proposer les changements par Pull Request et ne fusionner qu'après validation des contrôles CI. Ne pas contourner les contrôles en échec.
- Aucun secret, identifiant d'API ou jeton ne doit se trouver dans le navigateur ou dans le dépôt.

## Clean Architecture
- `domain/` contient des fonctions pures et des règles déterministes. Aucune dépendance au DOM, stockage, Canvas, moteur graphique ou horloge.
- `application/` orchestre les cas d'usage et définit les ports nécessaires au système.
- `infrastructure/` implémente les ports (horloge, stockage, réseau, etc.).
- `presentation/` ne fait que traduire les entrées/sorties utilisateur en appels applicatifs et rendu.
- Dépendances dirigées vers l'intérieur ; aucune importation de source entre deux jeux ; abstractions justifiées, pas d'architecture cérémonielle.

## Qualité et sécurité
- TypeScript strict ; éviter `any` ; privilégier fonctions courtes, typées, cohésives, noms explicites.
- Pas de dépendances sans justification ; respecter les licences ; aucune injection HTML non échappée ; utiliser les API DOM sûres.
- Gérer arrêt des timers, suppression des abonnements et visibilité de la page ; sauvegardes isolées par jeu et robustes à l'indisponibilité du stockage.
- Support clavier, tactile et petits écrans ; styles de focus visibles, textes lisibles et navigation accessible.
- Garder les règles testables avec une horloge et un hasard injectables.

## Tests et livraison — obligatoires
- Tests unitaires du domaine : état initial, déplacements, changements d'état, bords, scores, erreurs et fin de partie.
- Tests d'intégration sur les ports et transitions ; tests E2E Playwright : portail → jeu → interaction → retour portail.
- Exécuter lint, format, typecheck, unit tests, build, E2E. Corriger les échecs avant de déclarer le déploiement réussi.
- Fournir `game.json` valide, point d'entrée web, bouton/lien retour `../../`, documentation et test de fumée.
- Le champ `published: false` garde les prototypes hors du portail public.
- Ne jamais annoncer un site publié sans vérifier l'état GitHub Actions et l'URL publique.

## Workflow d'ajout d'un jeu
1. `pnpm create:game <slug> "Titre"`.
2. Implémenter le jeu et ses tests dans son dossier uniquement.
3. Passer `pnpm verify` puis mettre `published: true`.
4. PR, revue, fusion dans main : le catalogue et le site sont régénérés et publiés automatiquement.

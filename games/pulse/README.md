# PULSE

Un jeu d'arcade de précision à une seule commande. Une aiguille avance sur un anneau. Il faut frapper lorsqu'elle traverse l'arc lumineux. Après chaque réussite, l'aiguille inverse sa direction ; le nouvel arc apparaît plus loin dans sa trajectoire.

## Commandes

- **Espace / Entrée** : commencer, frapper, reprendre ou rejouer suivant l'état.
- **P / Échap** : pause ou reprise.
- **Bouton FRAPPER** et **clic / toucher le cadran** : geste principal.
- **Son** : coupé par défaut, activable volontairement.
- **Tous les jeux** : retour au portail.

Un tap réussi rapporte 1 point, un tap au centre de la fenêtre rapporte 2 points. La vitesse augmente et la fenêtre diminue avec les réussites. Le meilleur score est sauvegardé dans `localStorage` sous `games:pulse:best-v1`. Les parties peuvent être arrêtées à tout moment ; aucune récompense aléatoire ou mécanisme de rétention n'est utilisé.

## Architecture

- `src/domain/` : état et transitions pures, génération des cibles contrôlée.
- `src/application/` : contrôleur, ports pour horloge / stockage / audio, gestion de l'état et des effets.
- `src/infrastructure/` : adaptateurs navigateur, persistance robuste, son synthétisé sur action.
- `src/presentation/` : rendu Canvas haute densité, interface responsive, événements accessibles.
- `tests/unit/` et `tests/e2e/pulse.spec.ts` : règles, erreurs, états et parcours navigateur.

URL prévue : https://sopastopa.github.io/games/play/pulse/

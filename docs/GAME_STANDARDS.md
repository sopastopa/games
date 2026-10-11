# Critères d'acceptation d'un jeu

## Obligatoires

- Jeu autonome dans `games/<slug>` avec package, README, game.json, configuration Vite et TypeScript strict.
- Clean Architecture adaptée à la taille du jeu ; invariants testés par des fonctions pures ; pas de références au DOM dans `domain/`.
- Entrées clavier et tactiles si pertinents ; pas de scroll intempestif pendant les contrôles ; focus clavier visible.
- Affichage utilisable sur mobile et ordinateur ; texte accessible et commandes identifiables.
- Démarrage et redémarrage prévisibles ; pause lorsque pertinente ; gestion d'état et erreurs d'exécution.
- Lien de retour explicite au portail, sans perdre la possibilité de rejouer.
- Ressources libres ou sous licence compatible, pas de secrets côté client, stockage cloisonné.
- Tests unitaires des règles et limites, tests applicatifs des transitions, test de navigation E2E ; lint, format, typecheck et build passent.
- Données de catalogue valides ; `published` utilisé pour masquer les prototypes.

## Évolutions encouragées

- Critères de performance (chargement, FPS et gestion des ressources) adaptés au jeu.
- Accessibilité améliorée, contrôles paramétrables, son désactivable, absence d'animations gênantes.
- Tests exploratoires sur mobile et navigateur secondaire avant publication majeure.

La couverture ne doit pas être un chiffre aveugle : chaque règle critique doit faire l'objet d'un test significatif.

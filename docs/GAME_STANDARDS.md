# Critères d'acceptation d'un jeu

## Obligatoires

- Jeu autonome dans `games/<slug>` avec package, README, game.json, configuration Vite et TypeScript strict.
- Clean Architecture adaptée à la taille du jeu ; invariants testés par des fonctions pures ; pas de références au DOM dans `domain/`.
- Entrées clavier et tactiles si pertinents ; pas de scroll intempestif pendant les contrôles ; focus clavier visible.
- Affichage utilisable sur mobile et ordinateur ; texte accessible et commandes identifiables.
- Mode plein écran obligatoire sur ordinateur et mobile, activable/désactivable par un bouton accessible, via l'API native ou un repli occupant le viewport. Plateau, contrôles et état doivent rester utilisables sans déformation ni débordement horizontal, en portrait comme en paysage ; gérer les redimensionnements et la sortie par Échap.
- Tests unitaires dans chaque jeu des transitions plein écran, de l'absence de l'API et des refus de permission ; tests Playwright desktop et mobile vérifiant entrée, affichage jouable et sortie.
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

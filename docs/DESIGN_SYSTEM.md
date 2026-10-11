# Identité visuelle — Games

## Positionnement

Games est une **bibliothèque de petites expériences jouables**, pas une boutique ni une page promotionnelle. Le design répond à trois priorités : identifier rapidement les jeux, reconnaître la collection et entrer dans chaque expérience sans friction.

## Direction graphique

- **Fond** : papier presque blanc (`#f7f8f5`). Contenants blancs, panneaux ponctuels vert sauge.
- **Texte** : encre vert charbon (`#1d302d`) ; secondaire (`#63736d`).
- **Accent principal** : vert minéral (`#25584c`) pour actions, sélection, marque et liens.
- **Accent rare** : terre cuite (`#d87b5d`) pour le point de signature et quelques détails.
- **Séparateurs** : vert-gris clair (`#dce3dc`), 1 px ; pas d'ombres lourdes ni de dégradés décoratifs.
- **Typographies** : `Space Grotesk` pour la marque et les titres ; `DM Sans` pour textes, étiquettes et commandes, avec fontes de repli système. Le contraste et la lisibilité priment sur l'effet.
- **Signe graphique** : carré tourné composé de quatre pièces dont une terre cuite. Il suggère un système de jeux variés réunis sous une même signature.
- **Couvertures** : chaque jeu reçoit une composition géométrique réalisée en CSS (sans images de banques de photos), dont la couleur et les éléments renvoient à son univers. La métadonnée `icon` reste lue dans `game.json` ; les nouveaux jeux obtiennent un traitement simple en attendant un dessin spécifique.
- **Voix** : brève, informative, sans slogans trompeurs ni promesses marketing.

## Structure et composants

1. En-tête constant : marque, accès rapide à la collection et à sa présentation.
2. Hero éditorial : un titre court, une phrase de fonctionnement et le nombre réel de jeux (dérivé du catalogue).
3. Catalogue : catégories déduites de `game.json`, recherche insensible à la casse et aux accents, affichage filtré annoncé dans une zone `aria-live`.
4. Une seule grille de liens : le jeu mis en avant conserve exactement le même lien que les autres et n'est pas dupliqué. Les éléments cliquables possèdent des étiquettes explicites.
5. Section d'explication succincte et pied de page navigable.

**La grille n'est pas liée au nombre de jeux.** Les nouvelles fiches alimentent automatiquement recherche, filtres et compteur. Les données sont injectées via `textContent`, pas `innerHTML`.

## Entre le portail et les jeux

Les sept jeux sont des expériences **autonomes** avec leur propre direction artistique (y compris les univers sombres ou très colorés). Il serait trompeur de les repeindre tous de façon identique : cela nuirait à leurs contrastes de jeu et à leur identité. Leur élément commun est la navigation « Tous les jeux », harmonisée en bouton clair aux mêmes proportions, interaction, rayon et focus clavier. Les règles, contrôles et contenus propres aux jeux sont inchangés.

## Règles de cohérence

- Parcours tactile simple, cibles confortables, pas d'éléments interactifs décoratifs.
- `focus-visible` toujours visible ; raccourci de clavier « Aller à la collection ».
- Réduction ou suppression des micro-animations sous `prefers-reduced-motion`.
- Un seul message d'erreur lisible en cas de catalogue indisponible, état vide et action explicite pour revenir aux résultats.
- Breakpoints adaptés : grand écran (3 colonnes + une carte à la une), tablette (2 colonnes), téléphone (1 colonne) ; pas de scroll horizontal induit par la mise en page.
- Ne pas introduire de backend, comptes, suivi, achats ou ressources graphiques sous licence inconnue.

## Vérification

Les tests Playwright couvrent l'inventaire des jeux, les liens préservés, les catégories, la recherche (accents, casse, zéro résultat), la navigation clavier/retour, et la disposition sur téléphone. Les tests de gameplay de tous les jeux continuent de fonctionner indépendamment.

## Cadre clair transversal — réconciliation des expériences

La collection et les écrans des jeux emploient désormais un même **fond de papier clair** (`#f7f8f5`), une couleur d'encre (`#263630`), des séparateurs très légers et les mêmes polices. Les cadres suppriment les rayonnements décoratifs et les ombres excessives. À l'intérieur de chaque expérience, **les plateaux peuvent rester sombres** lorsqu'ils ont été conçus ainsi pour la lisibilité des pions, des cibles ou des dangers.

Ce n'est pas un nouveau moteur visuel partagé : les feuilles de style restent dans chacun des sept jeux autonomes. Un petit groupe de tokens `--site-paper`, `--site-ink`, `--site-muted`, `--site-line` et `--site-accent` est reproduit localement. Le lien de retour harmonisé qui existait sur les sept jeux est conservé, tout comme les palettes et comportements interactifs propres à chaque titre.

### Contrôles de non-régression

Le test `tests/e2e/game-frames.spec.ts` parcourt les sept jeux et vérifie la navigation de retour, la teinte claire du fond de page et l'absence de défilement horizontal au format téléphone. Ce test complète `tests/e2e/portal-design.spec.ts` qui vérifie filtres, recherche, états vides et parcours du catalogue.

Aucun changement n'est apporté au domaine, à la logique métier, à la persistance ou aux contrôles des jeux.

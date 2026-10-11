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


## Le cadre commun des sept jeux

La ressource `apps/portal/public/studio.css` est publiée à `/games/studio.css` et liée par chaque page de jeu via `../../studio.css`. La même typographie DM Sans / Space Grotesk, le fond papier, l'encre vert profond, le monogramme et les styles de navigation du portail s'appliquent donc aussi aux sept jeux.

Chaque jeu dispose d'un lien d'évitement clavier, d'un retour explicite au catalogue, du signe Games en en-tête et d'une petite navigation vers le titre suivant. Le cadre est clair, les zones de gameplay contrastées restent propres à chaque jeu. Les jeux ne s'importent aucun code entre eux. Le chargement d'une ressource CSS unique n'implique aucun couplage métier.

La palette commune du cadre utilise le vert minéral `#25584c`, l'encre `#1d302d`, le papier `#f7f8f5` et le filet `#dce3dc`. Les panneaux interactifs particuliers conservent leur contraste et leurs contrôles ; les grosses ombres et décorations superflues des zones extérieures sont neutralisées. `prefers-reduced-motion` est respecté.

L'ensemble est couvert par les tests de navigation et de styles des sept jeux dans `tests/e2e/studio-design.spec.ts`.

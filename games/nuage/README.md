# NUAGE — La fabrique des aurores

**Une aventure colorée en sept chapitres : une commande, six techniques à maîtriser et une histoire à vivre.**

Pip, une petite créature lumineuse, traverse sept paysages dont les couleurs ont disparu. De Roselune à la fabrique des aurores, les lettres de Mima, ancienne gardienne du ciel, révèlent peu à peu ce qui a réellement provoqué la disparition de la lumière. L'histoire se développe dans le décor, dans les dialogues avant et pendant la course, et dans les dénouements des chapitres.

## Commandes

- Pip avance automatiquement. **Espace, ↑, W** ou le bouton **Sauter** : saut ; maintien pendant la descente : plané temporaire. À partir du chapitre 4, une seconde pression en l'air déclenche **un double saut** (une fois par saut).
- **P ou Échap** : pause ou reprise ; « Rejouer » ramène au début du chapitre.
- **Mode Promenade** désactive toutes les collisions (encre, fossés, arches, lucioles mobiles) : toute l'histoire reste accessible sans exigence d'adresse.
- Retour « Tous les jeux » vers le portail.
- Chaque monde comporte un point de contrôle. L'erreur et son type sont indiqués à l'écran. Pas de limite de vies, de chronomètre ni de pénalité pour recommencer.

## Apprentissage du gameplay

| Chapitre | Compétence introduite | Défi |
| --- | --- | --- |
| 1 — Rose | Timing du saut | Deux flaques élargies ; apprendre à décoller au bon endroit. |
| 2 — Orange | Plané contrôlé | Fossés longs exigeant de gérer la descente. |
| 3 — Jaune | Alternance haute / basse | Passer au-dessus des fossés, puis sous des arches. |
| 4 — Vert | Double saut | Un seul second saut disponible en l'air ; long fossé à enchaîner. |
| 5 — Bleu | Courants ascendants | Maintenir pour être porté, relâcher pour redescendre. |
| 6 — Violet | Dangers mobiles | Lucioles qui oscillent ; rythme et lecture du décor. |
| 7 — Aurore | Combinaison | Alternance de tous les types de défis à vitesse accrue. |

Les obstacles et leur rythme sont fixes : aucune difficulté aléatoire. La vitesse augmente de 238 à 291 unités/s, tandis que les courses deviennent plus longues et combinent des éléments appris. L'intégralité des sept chapitres est automatiquement traversée sans aucune collision par des traces d'actions normales dans `tests/unit/courses.test.ts` : ces tests empêchent de livrer un chapitre impossible.

## Campagne et narration

1. **Le matin à l'envers** — Pip lit le message mystérieux de Mima au village de Roselune.
2. **La rue des lampions** — Une fanfare révèle pourquoi les couleurs devraient circuler.
3. **La boulangerie du soleil** — Le carnet de Mima révèle l'accident du prisme.
4. **La forêt qui murmure** — La forêt décrit la force des couleurs réunies.
5. **Les lettres à la mer** — Mima explique sa peur de perdre l'aurore.
6. **La gardienne des étoiles** — Pip rencontre Mima, apprend à pardonner.
7. **Un ciel pour tout le monde** — Le prisme se libère et l'aurore redevient collective.

Chaque monde comporte une narration d'ouverture, un message de mi-parcours, une fin distincte, un nouvel environnement dessiné par Canvas et trois souvenirs lumineux facultatifs. Les souvenirs n'empêchent jamais de terminer un chapitre. La progression et le mode Promenade sont conservés localement.

## Développement

- **Domain** : simulation de sauts, collisions, plané, checkpoints, récupération de souvenirs et passages de chapitre en fonctions déterministes.
- **Application** : contrôleur d'état, pause, scènes, progression et ports d'horloge et de stockage.
- **Infrastructure** : stockage local tolérant les erreurs, animation via requestAnimationFrame et nettoyage des ressources.
- **Presentation** : illustration vectorielle originale sur Canvas, textes narratifs DOM accessibles, commandes clavier/souris/tactile, responsive, reduced-motion.
- **Tests** : Vitest pour la physique, les scènes, la progression et la sauvegarde ; Playwright pour les parcours navigateur (catalogue → saut → pause → narration → retour).

Pour jouer localement : `pnpm --dir games/nuage dev`. Contrôle global : `pnpm verify`.

URL après publication : https://sopastopa.github.io/games/play/nuage/

## Références de conception

- Thomas Grip, GDC 2014, « Making Storytelling a Fundamental Part of the Gameplay Experience » : https://gdcvault.com/play/1020484/Making-Storytelling-a-Fundamental-Part
- Jolie Menzel, GDC 2017, « Level Design Workshop: A Narrative Approach to Level Design » : https://www.gdcvault.com/play/1024302/Level-Design-Workshop-A-Narrative
- Game Accessibility Guidelines, contrôle simple et alternatives : https://gameaccessibilityguidelines.com/ensure-controls-are-as-simple-as-possible-or-provide-a-simpler-alternative/

Pas de publicités, achats intégrés, récompenses aléatoires ou comptes à rebours. La progression narrative repose sur la curiosité et la maîtrise volontaire.

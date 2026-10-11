# PRISME — Assaut chromatique

Un shooter stratégique en vue du dessus, intégralement pensé pour un affichage plein écran.

## Objectif

Chaque secteur propose une arène déterministe générée avec une **graine partageable**. Détruire les sentinelles, charger les trois relais en restant dans leurs halos et atteindre le portail d'extraction. Quatre secteurs augmentent progressivement le nombre et la résistance des ennemis. Une défaite permet de rejouer exactement la même carte.

## Contrôles

- **PC :** ZQSD/WASD ou flèches pour bouger, souris pour viser, clic maintenu ou espace pour tirer, Maj pour une propulsion, P pour mettre en pause.
- **Mobile :** croix directionnelle, bouton TIR (visée assistée sur une cible visible) et PROPULSION ; les commandes peuvent être utilisées simultanément.
- Bouton **Plein écran** en haut, sortie par le même bouton ou Échap. Plein écran natif si disponible, repli qui remplit le viewport sinon.
- **Pause** automatique si l'onglet devient caché ; le jeu n'avance jamais en arrière-plan.

## Design et technique

- Monde de 13 × 13 cellules, couverture et chemins sculptés avec un générateur de nombres pseudo-aléatoires à seed.
- Validation de la connexité depuis le spawn pour les relais, l'extraction et les ennemis.
- Pas fixe de 1/60 seconde ; collisions, tirs, IA et conditions de victoire dans le domaine pur.
- Arme à chaleur : tirs rapides mais gestion des périodes de refroidissement.
- Propulsion brève avec recharge et invulnérabilité momentanée.
- Relais de différentes couleurs, recharge et réparation à leur activation.
- Modes portrait et paysage avec arène dimensionnée par l'espace réellement disponible, `devicePixelRatio` plafonné, canvas sans débordement.
- Aucune image ou bibliothèque tierce : dessin Canvas et typographie système.

## Études et références

- Génération procédurale : https://arxiv.org/abs/2410.15644 et évaluation des niveaux https://arxiv.org/abs/2404.18657
- Simulation à pas fixe : https://www.gafferongames.com/post/fix_your_timestep/
- API Fullscreen : https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide
- Accessibilité tactile et orientations : https://www.w3.org/TR/wcag2mobile-22/ et https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

## Vérification

`pnpm verify` à la racine : format, lint, TypeScript, tests unitaires, compilation, tests Playwright.

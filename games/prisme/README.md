# PRISME — Expéditions tactiques

Shooter tactique HTML5/CSS/Canvas intégralement plein écran, sans backend, à simulation déterministe de **60 ticks/s**.

## 41 × 41 cases, 16 salles, 4 districts

Une graine entière positive génère les murs, couvertures, bonus, sentinelles et armes. La même graine et le même secteur donnent exactement le même terrain. Chaque expédition comprend :

- **Atelier nord-ouest** : point de départ protégé, badges rose et cyan à trouver, réserve d'armure.
- **Néon nord-est** : porte rose ; premier relais.
- **Crypte sud-ouest** : porte cyan ; deuxième relais.
- **Noyau sud-est** : portes or ouvertes lorsque les deux premiers relais sont chargés ; troisième relais et extraction finale.
- Les trois relais demandent de rester à proximité pour les charger, chacun répare un point de coque et restaure une charge radar.
- Tous les ennemis doivent être neutralisés et les trois relais activés avant l'extraction. Chaque zone suivante conserve la seed et change les couvertures/bonus/ennemis.

La structure des connexions entre salles est garantie ; les portes bloquent les passages tant qu'elles sont fermées. La génération et les tests valident que les badges sont accessibles avant leurs verrous et qu'aucun objectif, bonus ou ennemi n'est isolé après ouverture. La progression peut être effectuée dans deux ordres (nord-est ou sud-ouest en premier).

## Exploration et stratégie

- **Caméra** suivant le joueur : le Canvas occupe toute la surface disponible sans réduire l'ensemble du terrain en miniature.
- **Brouillard de guerre** : visibilité actuelle basée sur la ligne de vue et les obstacles ; les cases déjà découvertes restent lisibles en sombre. Les ennemis hors de vue ne sont pas affichés, et l'IA n'attaque pas à travers les murs ou portes.
- **Radar R** : découvre un cercle supplémentaire de terrain, mais ne révèle pas magiquement les adversaires derrière les murs. Charges limitées, recharge aux relais et sur bonus.
- **Plan M** : met intégralement la simulation en pause et affiche les lieux découverts. Cliquer sur une case reconnue place un repère à suivre ; revenir au jeu ne fait perdre aucun progrès.
- **Portes E** : ouvrir un sas adjacent si le badge correspondant est trouvé (rose, cyan) ou si les deux premiers relais alimentent les portes or. Aucun consommable n'est dépensé, aucun blocage définitif possible.

## Combat et bonus

- Armes à échanger en ramassant des modules : **Impulsion** rapide, **Triangle** à trois tirs dispersés, **Lance** à tir concentré perforant.
- **Chasseur** rose rapide et agressif au corps à corps, **Tireur** orange au tir de longue portée, **Rempart** violet lent et robuste. L'alerte des tirs est rendue par des lignes de visée.
- **Armure** absorbant jusqu'à quatre impacts ; **batteries** rechargeant propulsion et radar ; **scanners** rechargeant la reconnaissance.
- Surchauffe et propulsion de courte durée introduisent un rythme d'attaque, de couverture et de repositionnement ; les tirs ennemis sont bloqués par les murs et les sas.

## Commandes

| Action        | PC                                       | Mobile                                                          |
| ------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Déplacement   | ZQSD/WASD/flèches                        | Joystick gauche libre                                           |
| Tir et visée  | Souris + clic ou Espace (visée assistée) | Joystick droit : appui = tir assisté ; glisser = viser et tirer |
| Propulsion    | Maj                                      | Bouton DASH                                                     |
| Porte         | E                                        | Bouton PORTE                                                    |
| Scanner       | R                                        | Bouton RADAR                                                    |
| Plan tactique | M                                        | Bouton Plan ou minimap                                          |
| Pause         | P ou bouton                              | Bouton Pause                                                    |
| Plein écran   | Bouton, quitter avec Échap               | Bouton, mode natif ou repli viewport                            |

Les joysticks se recentrent au contact, avec zone morte anti-dérive, et peuvent être utilisés simultanément. L'interface s'adapte au mode portrait/paysage et aux encoches. La partie se suspend si le navigateur passe en arrière-plan.

## Architecture

- \`src/domain/map.ts\` : graine reproductible, districts, portes, graphes d'accessibilité, ligne de vue et brouillard.
- \`src/domain/rules.ts\` : règles pures de combat, ramassage, ouverture, IA et extraction.
- \`src/application/GameController.ts\` : orchestrateur, modes, plan et progression.
- \`src/infrastructure/browser.ts\` : sauvegarde locale isolée et tolérante aux erreurs.
- \`src/presentation/renderer.ts\` : caméra, affichage Canvas, minimap, plan.
- \`src/presentation/main.ts\` : contrôles clavier/souris/tactile, boucle d'animation et interface.

## Références étudiées

- Graham McAllister, [Twin-Stick Shooter Usability](https://www.gamedeveloper.com/design/a-guide-to-ios-twin-stick-shooter-usability) : zones tactiles dynamiques, recentrage et clarté des contrôles.
- Apple, [Game controls](https://developer.apple.com/design/human-interface-guidelines/game-controls) : zones de pouce et safe areas.
- [Game Mechanics Hoard — Fog of War](https://gamemechanicshoard.com/mechanic/fog-of-war/) : visibilité courante versus exploration persistante ; ne pas avantager l'IA par omniscience.
- [Kiwi Studios — Fog of War](https://kiwistudios.co/fog-of-war/) : séparation entre la vision de jeu et le rendu visuel.
- [Solvable procedural dungeons](https://salivity.github.io/game-development/article/ensuring-solvable-paths-in-procedural-dungeons) : graphe de missions et accès/clefs avant génération géométrique.
- [Procedural generation of dungeons with locked-door missions](https://www.sciencedirect.com/science/article/pii/S0957417421004504) : génération contrainte par la solvabilité.
- [Enemy archetypes](https://www.jonwalker.design/portfolio-docs/enemy-archetypes) : rôles distincts, forces et faiblesses lisibles.
- [Fix Your Timestep](https://www.gafferongames.com/post/fix_your_timestep/) : temps de simulation fixe et rendu indépendant.

## Validation

\`pnpm verify\` à la racine du monorepo, comprenant formatage, lint, typecheck, tests unitaires, compilation et Playwright (PC, mobile, portrait et paysage).

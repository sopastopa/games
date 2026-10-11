# REBOND — vise, tire et trouve le bon ricochet

Un jeu de trajectoires à commandes intuitives et physique déterministe, sans minuteur imposé. **Les 18 niveaux ont été entièrement repensés : la cible reste verrouillée tant que les ricochets numérotés n'ont pas été effectués dans l'ordre.**

## Comment jouer

- Sur ordinateur ou mobile : fais glisser depuis la bille vers le bas-gauche (comme un lance-pierre), puis relâche pour lancer.
- Déplacement au clavier : **←/→** ajuste l'angle, **↑/↓** ajuste la puissance, **Espace/Entrée** lance.
- **R** prépare un nouveau lancer. Le bouton Réinitialiser recommence le niveau.
- Objectif : toucher les **relais numérotés** dans l'ordre (1 → 2 → 3 → 4 selon le chapitre) pour déverrouiller la cible, puis l'atteindre. **Viser directement la cible ne permet jamais de gagner.**
- Progression : niveaux 1–5, 1 ricochet ; 6–11, 2 ; 12–16, 3 ; 17–18, 4. Des rochers sombres non activables s'ajoutent pour créer des obstacles et des trajectoires trompeuses.
- Les relais déjà activés deviennent verts. La prévisualisation de trajectoire se limite au départ pour laisser les ricochets à découvrir.
- Chaque niveau conserve le meilleur nombre de tentatives. Pas de limite d'essais ni de récompenses externes.

## Architecture

- domain: moteur physique pur, détection de collisions physiques réelles, niveaux déterministes dérivés de tirs de référence avec 1 à 4 relais en ordre, testés pour leur faisabilité.
- application: contrôleur d'états, tirs et progression, ports d'horloge et de persistance.
- infrastructure: horloge requestAnimationFrame et sauvegarde localStorage robuste.
- presentation: Canvas 2D responsive avec visée, traînée et accès clavier.
- tests/unit: physique, niveau de référence, états, persistance.
- tests/e2e: parcours portail → jeu → interactions → retour.

URL : https://sopastopa.github.io/games/play/rebond/

La conception suit les principes de clarté, maîtrise, retour immédiat et difficulté progressive décrits par GameFlow (Sweetser & Wyeth, 2005) et la théorie de l'autodétermination appliquée aux jeux (Ryan, Rigby & Przybylski, 2006), sans mécanismes de monétisation ou de rétention coercitive.

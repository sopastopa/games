# REBOND — vise, tire et trouve le bon ricochet

Un jeu de trajectoires à commandes intuitives et physique déterministe, sans minuteur imposé.

## Comment jouer

- Sur ordinateur ou mobile : fais glisser depuis la bille vers le bas-gauche (comme un lance-pierre), puis relâche pour lancer.
- Déplacement au clavier : **←/→** ajuste l'angle, **↑/↓** ajuste la puissance, **Espace/Entrée** lance.
- **R** prépare un nouveau lancer. Le bouton Réinitialiser recommence le niveau.
- Objectif : la bille doit toucher l'anneau lumineux. Les obstacles circulaires et les murs peuvent produire des ricochets.
- Chaque niveau conserve le meilleur nombre de tentatives. Pas de limite d'essais ni de récompenses externes.

## Architecture

- domain: moteur physique pur et niveaux déterministes générés depuis des tirs de référence, validés par les tests.
- application: contrôleur d'états, tirs et progression, ports d'horloge et de persistance.
- infrastructure: horloge requestAnimationFrame et sauvegarde localStorage robuste.
- presentation: Canvas 2D responsive avec visée, traînée et accès clavier.
- tests/unit: physique, niveau de référence, états, persistance.
- tests/e2e: parcours portail → jeu → interactions → retour.

URL : https://sopastopa.github.io/games/play/rebond/

La conception suit les principes de clarté, maîtrise, retour immédiat et difficulté progressive décrits par GameFlow (Sweetser & Wyeth, 2005) et la théorie de l'autodétermination appliquée aux jeux (Ryan, Rigby & Przybylski, 2006), sans mécanismes de monétisation ou de rétention coercitive.

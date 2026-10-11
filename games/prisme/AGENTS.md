# PRISME — conventions spécifiques

- Shooter tactique en temps réel pensé d'abord en plein écran : Canvas occupant **tout** l'espace disponible, carte à défilement et caméra suivant le joueur ; en portrait et paysage, ne jamais laisser de bande noire, de débordement ou de commandes hors écran.
- Simulation déterministe de 60 ticks par seconde ; ni DOM, Canvas, horloge, Math.random ni localStorage dans le domaine.
- Monde généré de 41 × 41 cellules avec 16 salles. Les badges rose/cyan sont accessibles avant les portes colorées ; les deux premiers relais permettent ensuite d'ouvrir les portes or vers le dernier district. Tester la solvabilité sur de nombreuses graines (pas seulement des snapshots).
- Portes bloquent physique, projectiles, vision et IA jusqu'à ouverture. Le domaine conserve les états d'ouverture.
- Brouillard : distinguer terrain non découvert, terrain découvert et actuellement visible. Le radar découvre du terrain, pas les ennemis derrière les murs. Les ennemis ne doivent pas attaquer depuis un endroit indécelable et les tirs sont télégraphiés.
- Trois types de sentinelles avec comportements, vitesse et résistance différents ; trois armes avec cadences/tirs distincts ; bonus d'armure et de reconnaissance. Ne pas laisser de phase tactique factice : le plan doit figer le combat et permettre de fixer un repère sur les cases explorées.
- Mobile : joystick analogique à recentrage au toucher, zone morte, commande de tir indépendante, outils accessibles sans glissement et contrôles tactiles simultanés. Souris/clavier toujours utilisables.
- Plein écran natif avec fallback viewport, sortie Échap ou bouton, tests unitaires et Playwright desktop/mobile. Mettre en pause si l'onglet est caché ou perd le focus et libérer tous les contrôles maintenus.
- Progression localStorage validée/isolée ; pas de dépendances additionnelles, de publicité ou de mécanique de rétention coercitive.
- Ne jamais modifier le portail et les autres jeux. \`game.json\` assure la découverte déclarative.

# LISIÈRE — règles et garanties

- Respecter /AGENTS.md, Clean Architecture, tests unitaires, CI et E2E.
- Le domaine est pur : pas de DOM, temps, stockage ni Math.random.
- Une action consiste à réclamer une case vide orthogonalement voisine d'une case alliée.
- Toute case adverse non-capitale possédant deux voisins alliés ou plus est capturée simultanément après le placement.
- Les sanctuaires valent trois points, les autres terres un point ; les falaises sont infranchissables.
- Les capitales sont toujours protégées contre la conversion.
- On passe automatiquement son tour si aucun placement n'est disponible. La partie se termine quand aucune faction ne peut jouer.
- L'adversaire prend une décision déterministe par minimax borné, sans interface avec la présentation.
- Les cartes sont symétriques à 180° pour garantir une base de départ équitable.
- L'IA n'agit qu'après le délai fourni par un port injectable ; gérer l'annulation, la navigation et la destruction proprement.
- Clavier, souris, tactile, focus visible, responsive, préférence reduced-motion.
- Jeu sans compte, notification, achats ou récompense aléatoire ; progression locale robuste.

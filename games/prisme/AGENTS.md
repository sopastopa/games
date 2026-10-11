# PRISME — règles permanentes

- Shooter tactique en temps réel conçu en premier pour le plein écran. Le shell, l'arène et toutes les commandes doivent rester jouables en portrait et en paysage sur PC et mobile.
- Simulation déterministe à 60 ticks par seconde ; aucune horloge, `Math.random`, DOM, Canvas ou API de stockage dans `src/domain/`.
- Graine entière positive reproductible, carte accessible et départ protégé. Aucun ennemi ni relais inatteignable. Les relances avec la même graine et le même secteur recréent les mêmes cartes.
- Le joueur doit neutraliser les sentinelles, capturer trois relais et rejoindre l'extraction. La surchauffe, les couvertures et la propulsion créent des choix tactiques vérifiables.
- Distinguer explicitement prête, en cours, pause, secteur sécurisé, victoire et défaite. Interrompre l'horloge et les contrôles en arrière-plan ; remettre à zéro les commandes tenues à chaque pause.
- Le stockage de la progression est isolé, validé et tolérant aux refus du navigateur.
- Plein écran natif avec repli viewport, bouton et Échap, état de partie intact. Tester transitions, erreurs, mobile et desktop avec Vitest et Playwright.
- Ne pas changer le portail ni les jeux existants : `game.json` assure la découverte automatique.
- Aucun compte, publicité, minuterie imposée, récompense manipulatrice ou dépendance externe.

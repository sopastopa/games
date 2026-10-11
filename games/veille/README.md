# VEILLE — Les archives englouties

Jeu original d'exploration tactique au tour par tour : douze secteurs scénarisés dans trois actes, cartes reproductibles à partir d'une graine et sauvegarde instantanée sans compte.

## Boucle de jeu

1. Choisir parmi trois spécialités (vision étendue et propulsion longue, énergie améliorée, ou coque renforcée).
2. Explorer une grille de 9 × 9 cases partiellement masquée, en trouvant les fragments indispensables à l'extraction.
3. Prendre des décisions de route entre marées dangereuses (trois tours sur six), murs, sentinelles qui réagissent tous les deux tours, batteries et stations de recharge.
4. Dépenser l'énergie disponible pour scanner, propulser ou repousser les sentinelles. Les archives facultatives ajoutent trois textes par secteur au journal permanent.
5. Rejoindre l'extraction, découvrir la suite de l'histoire et débloquer le prochain secteur. Rejouer pour une meilleure trajectoire, avec une spécialité ou une graine différente.

Les graines déterminent l'intégralité des niveaux ; le générateur contrôle la connectivité et place les éléments sur les cases accessibles. Les niveaux ne deviennent pas plus difficiles par un chronomètre : l'ajout progressif de nouvelles menaces impose de combiner les techniques apprises.

## Commandes

- Flèches ou WASD : une case par tour ; cliquer ou toucher une case voisine est également possible.
- Maj + flèche, ou bouton « Propulsion » puis une direction : traverser deux ou trois cases pour deux charges d'énergie.
- 1 : scanner ; 2 : repousser les sentinelles proches ; point : attendre une phase de marée.
- Quatre boutons directionnels tactiles et boutons pour chaque action ; un bouton de plein écran natif ou occupant toute la fenêtre si l'API navigateur est indisponible.
- Quitter une mission ou rejouer ne retire jamais les archives déjà découvertes.

## Architecture

- `domain/` : générateur déterministe, géométrie, simulation pure, validation des sauvegardes, récit.
- `application/` : contrôleur de campagne, règles de déblocage, collection et record, port de stockage.
- `infrastructure/` : localStorage versionné, gestion des erreurs du navigateur.
- `presentation/` : interface DOM réactive, grille sémantique, responsive, commandes et plein écran.
- `tests/unit/` : invariants, mécaniques, campagne, sauvegardes, plein écran ; `tests/e2e/veille.spec.ts` : navigation, interaction et mobile.

Commande globale : `pnpm verify`. URL : https://sopastopa.github.io/games/play/veille/

## Intentions game design

La motivation doit émerger de l'autonomie (choisir rôle et route), de la compétence (optimiser les décisions sur plusieurs systèmes) et de la curiosité (découvrir les archives). Les graines de cartes rejouables et les archives optionnelles donnent des objectifs personnels sans punir les échecs ni imposer une fréquence de connexion.

Références : [GDC — Player Autonomy](https://www.gdcvault.com/play/1021257/The-Importance-of-Player-Autonomy), [GDC — Decisions That Matter](https://gdcvault.com/play/1021073/Level-Design-in-a-Day), [GDC — Intrinsic Player Motivation](https://www.gdcvault.com/play/1015568/Intrinsic-and-Extrinsic-Player-Motivation).

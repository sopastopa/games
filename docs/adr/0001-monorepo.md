# ADR 0001 — Monorepo de jeux indépendants

Statut : accepté — 2026-10-11.

## Contexte
Nous publions régulièrement des jeux web TypeScript ; il faut un portail unique, une architecture répétable et une CI standardisée.

## Décision
Employer un monorepo pnpm avec portail séparé, jeux isolés et métadonnées déclaratives par jeu. Vite compile chaque application vers un répertoire distinct sous un seul artefact statique GitHub Pages. Vitest et Playwright assurent des contrôles automatiques. AGENTS.md définit les conventions pour les futurs agents.

## Conséquences
Un jeu peut choisir sa technologie de rendu tout en respectant les contrats de publication. Le build complet simplifie la cohérence ; il pourra être optimisé lorsque le nombre de jeux le justifiera. Aucun backend n'est fourni, et des fonctionnalités serveur nécessiteront un hébergement complémentaire.

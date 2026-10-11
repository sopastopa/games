# Games — mini-jeux web indépendants

Un portail de jeux TypeScript hébergé sur GitHub Pages : https://sopastopa.github.io/games/.

## Structure
- `apps/portal` : catalogue public, généré depuis les `games/*/game.json` publiés.
- `games/<slug>` : jeu indépendant, structuré en domaine / application / infrastructure / présentation.
- `templates/game` : modèle minimal fonctionnel pour les nouveaux jeux.
- `scripts/build-site.mjs` : validation du catalogue, compilation isolée de chaque jeu, assemblage de `dist/`.
- `tests/e2e` : parcours réels depuis le catalogue (Playwright).
- `docs/` : décisions, règles d'architecture et standards.
- `AGENTS.md` : consignes obligatoires pour les agents de programmation.

## Développement (Node.js 22+ et pnpm 10)
```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev:portal
pnpm dev:snake
pnpm create:game breakout "Breakout"
pnpm verify
```

Le catalogue est généré pendant `pnpm build` ; pour tester le portail localement, exécuter d'abord `pnpm build` puis `pnpm dev:portal`.

## Ajouter un jeu
Créer le jeu à partir du template, implémenter les règles et leurs tests, conserver `published: false` pendant le développement. Définir `published: true` quand le jeu est prêt. La compilation construit automatiquement une page sous `/games/play/<slug>/` ; aucun changement manuel au portail ou au workflow n'est nécessaire.

## Qualité et publication
- Les Pull Requests passent format, lint, typage, tests unitaires, build et Playwright.
- `main` déclenche une nouvelle validation et la publication d'un unique artefact GitHub Pages, si tous les contrôles passent.
- Une version en échec n'écrase pas la version publiée.
- Les contrôles de protection de `main` sont à activer dans les paramètres du dépôt (droits admin requis).

Voir `docs/ARCHITECTURE.md`, `docs/GAME_STANDARDS.md` et `docs/adr/0001-monorepo.md`.

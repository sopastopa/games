# Snake

A standalone TypeScript/Vite game. URL after publication: /games/play/snake/.

Architecture: `src/domain` (pure rules), `src/application` (state machine and ports), `src/infrastructure` (browser implementations), `src/presentation` (Canvas and DOM).

Commands from repository root: `pnpm dev:snake`, `pnpm test:unit`, `pnpm typecheck`, `pnpm build`.
Controls: arrows/WASD; Space starts or pauses; touchscreen D-pad; buttons restart and return to catalog. Best score is saved locally.

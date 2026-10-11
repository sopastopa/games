# Snake — Specific instructions

- The grid is 16 × 16 and the simulation advances on discrete ticks.
- Keep movement, food and collisions in pure functions under src/domain/.
- Inject time, randomness and best-score persistence through application ports.
- Keep the renderer free of gameplay rules.
- Preserve keyboard, touch, restart, pause and return-to-portal accessibility.
- Expand unit tests whenever domain rules change.

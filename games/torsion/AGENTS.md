# TORSION — instructions spécifiques

- Un geste principal : cliquer, toucher ou activer au clavier un carré de 2 × 2 pour tourner son contenu de 90° dans le sens horaire.
- Les cibles restent fixes ; les pièces numérotées doivent occuper les cibles correspondantes. Les pierres fixes empêchent les rotations qui les toucheraient.
- Le domaine est déterministe, sans DOM, horloge, stockage ni hasard : aucun mécanisme de rétention coercitif.
- Les 12 puzzles sont créés en appliquant les inverses de tours légaux à des grilles résolues. Le test de parcours inverse doit réussir pour chacun.
- Une rotation sans effet ne consomme aucun mouvement ; annuler ne coûte rien. Pas de chronomètre, limite de mouvements ou pénalité.
- Les ateliers sont débloqués un par un ; progression stockée avec tolérance aux corruptions et à l'indisponibilité de localStorage.
- Contrôles accessibles au clavier, souris et toucher ; retour portail "../../", focus visible, reduced-motion, responsive.
- Toute évolution nécessite tests de règles, niveaux, contrôleur, stockage et Playwright.
- Plein écran obligatoire : API native avec repli viewport sur mobile, sortie par le bouton ou Échap, rendu adaptatif sans perdre l'état. Maintenir tests unitaires de transitions et tests Playwright desktop/mobile.

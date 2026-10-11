# PULSE — Instructions spécifiques

- La logique de jeu est déterministe et pure dans src/domain/rules.ts. Ni DOM, ni audio, ni horloge dans le domaine.
- Un seul geste essentiel : frapper lorsque le curseur est à l'intérieur de l'arc. Chaque réussite inverse sa direction.
- Les scores proviennent seulement de la précision : 1 point pour une réussite, 2 points au centre ; pas de récompense aléatoire.
- Le centre du prochain arc est déterminé par un aléa injectable ; des limites garanties empêchent toute cible injuste.
- Le jeu est adapté aux claviers, souris et écrans tactiles. Pause, reprise, relance, retour et mode silencieux.
- Respecter les préférences de mouvement réduit et suspendre le jeu si la page n'est plus visible.
- Aucun mécanisme de rétention coercitif : ni récompense quotidienne, ni publicité, ni notifications, ni achats.
- Les tests unitaires couvrent l'algorithme de précision, la progression, les états et le stockage.

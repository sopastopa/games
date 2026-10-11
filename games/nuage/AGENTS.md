# NUAGE — règles et garanties

- Un jeu d'aventure narratif et d'adresse, pas de puzzle ou de stratégie. Le personnage avance automatiquement ; un bouton permet de sauter et de planer en le maintenant.
- Domain pur et déterministe : aucune référence au DOM, Canvas, localStorage, horloge ou Math.random dans la simulation.
- Le joueur franchit les obstacles au bon moment. En mode Promenade, les obstacles sont non bloquants et l'histoire reste intégralement accessible.
- Chaque chapitre possède une narration d'ouverture, de mi-parcours et de dénouement qui fait avancer l'intrigue de Pip et du village des aurores. Les couleurs et décors traduisent le récit.
- Les souvenirs lumineux à récupérer sont facultatifs : ils enrichissent l'exploration, ne verrouillent aucun chapitre.
- Les erreurs renvoient sans pénalité au début ou à un point de contrôle ; pas de limite de vies, d'horloge, de score de vitesse, de pression quotidienne, de récompenses aléatoires ou de compte.
- Le clavier, souris et tactile disposent de commandes explicites, le jeu se met en pause en arrière-plan et respecte prefers-reduced-motion.
- Démontage correct de l'horloge et des événements ; progression sauvegardée sous une clé propre au jeu, robuste en cas de stockage indisponible.
- Toute sortie doit être vérifiée : unitaires pour la simulation, chapitres, contrôleur et persistence ; Playwright pour l'aventure réelle, l'accessibilité et le retour au portail.

## Graduation de difficulté (version 2)

- Conserver les sept chapitres narratifs, leur histoire et le mode Promenade.
- Les nouveaux types de défis sont : encre au sol, fissures sans sol, arches basses, double saut, courants ascendants et lucioles d'encre mobiles.
- Le domaine doit gérer leurs collisions déterministes ; tous les mouvements et hitboxes sont partagés avec le renderer par les mêmes constantes/fonctions.
- La commande de saut aérien est autorisée à partir du chapitre 4 seulement et limitée à une impulsion supplémentaire par réception au sol.
- Les courants exercent une poussée uniquement pendant le maintien du bouton en l'air ; les fossés exigent de franchir un espace sans sol.
- Garantir les points de contrôle hors danger et la possibilité de réussir chaque chapitre sans collision en mode normal grâce aux traces rejouées par `tests/unit/courses.test.ts`.
- Toute modification de physique ou de difficulté doit mettre à jour les parcours attestés, sans supprimer le test qui les valide.
- En mode Promenade, tous les types de dangers restent visibles mais ne font jamais échouer le joueur.

# REBOND — conventions du jeu

- Respecter les exigences de /AGENTS.md : domaine pur, contrôleur applicatif, adaptateurs, présentation et tests.
- Le domaine simule une physique déterministe avec une cadence fixe de 1/120 seconde. La présentation ne modifie jamais les règles de collision.
- La cible est verrouillée avant activation de tous les relais numérotés en ordre strict. Un passage direct par la cible ne doit jamais produire une victoire.
- Les niveaux doivent avoir une trajectoire de référence vérifiable automatiquement, incluant exactement la séquence de ricochets requise ; toute modification aux obstacles nécessite un test de solvabilité.
- La difficulté croît de 1 à 4 impacts obligatoires, et les pierres neutres peuvent détourner les tirs sans déverrouiller la cible.
- Aucun compte, aucune publicité, pas de récompense aléatoire ou mécanique de rétention coercitive.
- Une partie est constituée de lancements indépendants ; les échecs sont sans pénalité autre que le nombre de tentatives. Le joueur peut reprendre et quitter librement.
- Au clavier : flèches pour viser et doser, espace pour lancer. Au toucher/souris : tirer la bille vers l'arrière et relâcher.
- Respecter la préférence reduced-motion, la visibilité de page et le support mobile. Nettoyer les écouteurs et l'horloge.
- Ne pas modifier le portail ni les autres jeux. L'enregistrement dans le catalogue est déclaratif via game.json.
- Plein écran obligatoire : API native avec repli viewport sur mobile, sortie par le bouton ou Échap, rendu adaptatif sans perdre l'état. Maintenir tests unitaires de transitions et tests Playwright desktop/mobile.

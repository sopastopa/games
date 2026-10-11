# VEILLE — règles spécifiques

- Jeu d'exploration tactique au tour par tour : la logique, la génération de cartes, les marées, les sentinelles, les coûts et les conditions de victoire restent purs dans `src/domain`.
- Les cartes sont générées par une graine entière reproductible ; tous les fragments, archives et points d'extraction sont atteignables. Le générateur ne peut produire de carte isolant un objectif.
- Une mission demande de collecter tous ses fragments `✦` avant d'atteindre le point d'extraction `⬡`. Les archives `◇` sont facultatives ; leur découverte est conservée entre les sessions.
- Trois rôles aux compétences différentes : Éclaireur, Ingénieure, Gardien. Les commandes de scan, impulsion, propulsion et attente doivent modifier la simulation de manière significative et déterministe.
- Les sentinelles ne doivent pas apparaître sur les objectifs ni téléporter le joueur ; la marée haute intervient trois tours sur six. Les refus d'action ne doivent pas consommer de tour.
- Douze secteurs narratifs, progression séquentielle, rejouabilité grâce aux graines et aux rôles ; persistance locale robuste et compartimentée.
- Aucune minuterie, monnaie, série quotidienne, publicité ou incitation coercitive. Le joueur arrête quand il le souhaite sans perdre les découvertes.
- Clavier, toucher, souris, focus visible, mode plein écran natif avec repli viewport, pause intrinsèque au tour par tour, préférence reduced-motion et retour portail.
- Tester les invariants de génération sur de nombreuses graines, la résolution réelle d'au moins un secteur, les coûts, la victoire, la défaite, la persistance et les contrôles plein écran, puis Playwright (catalogue, interactions, mobile, plein écran, retour).

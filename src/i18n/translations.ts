// src/i18n/translations.ts
// WorldPilot Bilingual Dictionary (FR / EN)

export type UILanguage = 'fr' | 'en';

export const translations = {
  fr: {
    // Mode names
    modeConception: 'Conception',
    modeSimulation: 'Simulation',
    modeObservatoire: "L'Observatoire",
    backToStudio: '← Revenir au Studio',
    photoHD: 'Photo HD',
    hideGuide: 'Masquer guide',
    showGuide: 'Afficher guide',
    adaptE2: '⚡ Adapter (E2)',
    observatoryTitle: "L'Observatoire",

    // Tooltips
    capturePhotoTooltip: "Prendre une photo HD instantanée de la scène 3D [Alt+S]",
    spatialGuideTooltip: "Afficher ou masquer le guide IA 3D",
    gridTooltip: "Afficher la grille [G]",
    labelsTooltip: "Afficher les étiquettes [L]",
    webPanelTooltip: "Afficher / agrandir le panneau Web 3D [W]",
    atmosphereTooltip: "Changer l'atmosphère spatiale et la gravité",
    cinematicTooltip: "Réglages visuels cinématographiques [Alt+C]",
    lightingDayTooltip: "Lumière du jour",
    lightingNightTooltip: "Lumière du soir / heure dorée",
    clearSceneTooltip: "Vider la scène et repartir de zéro [Alt+Suppr]",
    recenterCameraTooltip: "Recentrer la caméra [⌖]",
    cameraFramingTooltip: "Cadrage caméra",
    cinematicTourTooltip: "Visite cinématique 360°",

    // Navigation bar & Playback
    navOrbit: "1 doigt tourner",
    navZoom: "2 doigts zoomer",
    navPan: "Shift + glisser déplacer",
    simulatePlay: "Simuler",
    simulatePause: "Pause",
    logicNodes: "Logique",
    worldIR: "WorldIR",
    goldenHour: "Heure dorée",
    naturalLight: "Lumière naturelle",

    // Prompt & Author Studio
    promptPlaceholder: "Un espace, des objets, une interaction… Décrivez ce que vous imaginez.",
    promptSubmit: "Entrée pour créer (⇧+Entrée saut de ligne)",
    giveLifeButton: "Donner vie à mon monde",
    creatingWorld: "Création en cours…",
    quickInspirations: "Inspirations rapides",
    exploreAll: "Explorer tout →",
    searchPlaceholder: "Rechercher une expérience (ex: Vuitton, café, batterie...)",

    // ZeroClickLaunchpad
    guidedTourButton: "Lancer le parcours guidé (3 min)",
    guidedTourSubtitle: "Démonstration automatisée en 5 actes · Scénario complet",
    launchpadTitle: "Mode découverte · 0-clic",
    launchpadSubtitle: "Vérifiez une interaction de bout en bout",
    launchpadDesc: "Ce scénario préconstruit montre une scène, une interaction et les contrôles disponibles.",
    blankCanvas: "Toile vierge",
    blankCanvasTooltip: "Masquer le lanceur pour avoir une vue 100% libre",
    reopenLaunchpad: "Rouvrir le lanceur d'expériences (0-clic)",
    loadSimulation: "⚡ Charger la simulation",
    observabilityGizmo: "Observabilité et gizmo [F2]",
    observabilityTooltip: "Ouvrir l'inspecteur d'observabilité réactive (flags, règles causales, gizmo 3D) [F2]",
    hackathonVictoria: "Hackathon Victoria VR",
    showcaseSupercarTitle: "Showroom Victoria VR et supercar",
    showcaseSupercarBadge: "Démo guidée · scène de démonstration",
    showcaseSupercarDesc: "Hypercar profilée sur estrade rotative, baie vitrée panoramique avec vue sur la mégapole, salon VIP et teinte nacrée.",
    showcaseSupercarHighlights: ["Scène 3D interactive", "Règles visibles", "Test et diagnostic"],

    // Observatory & Telemetry
    obsTitleCreator: "L'Observatoire · Santé et diagnostic visuel",
    obsTitleResearch: "L'Observatoire · Cockpit d'analyse comportementale",
    creatorModeBtn: "Mode créateur (clair et visuel)",
    researchModeBtn: "Mode chercheur (formel et thèse)",
    tabDiagnosis: "🩺 1. Diagnostic et santé",
    tabEmergent: "👆 2. Gestes et interactions détectés",
    tabBlastRadius: "🛡️ 3. Stabilité et non-régression",
    tabPedagogy: "🎯 4. Quêtes et scénarios prêts",
    tabTelemetry: "⏱️ 5. Activité et confort",
    tabAdaptiveLoop: "🛰️ 1. Boucle adaptative (méta-contrôleur)",
    tabAffordances: "💡 2. Affordances émergentes",
    tabSBR: "🛡️ 3. Semantic Blast Radius",
    tabBloom3D: "🎓 4. Compilateur pédagogique (Bloom 3D)",
    tabMDPTensors: "📊 5. Télémétrie spatiale et MDP",

    // Guided tour notice
    guidedTourNoticeAct3: "Parcours guidé actif · Démonstration de l'Observatoire : analyse causale et croyances bayésiennes H1/H2 en direct.",
    guidedTourNoticeAct4: "Parcours guidé actif · Benchmark des 4 personas : comparaison en temps réel de Persona A (compréhension causale) vs Persona B (heuristique).",
    guidedTourAutoNotice: "La visite se poursuit d'elle-même dans quelques instants.",

    // Acts short names
    act1Short: "1. Conception E1",
    act2Short: "2. Simulation",
    act3Short: "3. Observatoire",
    act4Short: "4. Benchmark",
    act5Short: "5. Adaptation E2",

    // Benchmark & Personas
    benchmarkMatrixTitle: "Matrice de benchmark des 4 personas cognitifs",
    benchmarkSubtitle: "Vérification formelle de la robustesse bayésienne face aux pièges d'heuristiques de surface.",
    runAllBenchmarkBtn: "Lancer le benchmark global (4 personas)",
    activeSimulation: "Simulation active",
    relaunch: "Relancer",
    simulate: "Simuler",
  },
  en: {
    // Mode names
    modeConception: 'Design',
    modeSimulation: 'Simulation',
    modeObservatoire: 'Observatory',
    backToStudio: '← Back to studio',
    photoHD: 'HD photo',
    hideGuide: 'Hide guide',
    showGuide: 'Show guide',
    adaptE2: '⚡ Adapt (E2)',
    observatoryTitle: 'Observatory',

    // Tooltips
    capturePhotoTooltip: "Take an instant HD photo of the 3D scene [Alt+S]",
    spatialGuideTooltip: "Show or hide 3D AI guide",
    gridTooltip: "Toggle grid [G]",
    labelsTooltip: "Toggle labels [L]",
    webPanelTooltip: "Show / expand 3D Web panel [W]",
    atmosphereTooltip: "Change spatial atmosphere and gravity",
    cinematicTooltip: "Cinematic visual post-processing [Alt+C]",
    lightingDayTooltip: "Daylight lighting",
    lightingNightTooltip: "Evening / golden hour lighting",
    clearSceneTooltip: "Clear scene and start fresh [Alt+Delete]",
    recenterCameraTooltip: "Recenter camera [⌖]",
    cameraFramingTooltip: "Camera framing",
    cinematicTourTooltip: "360° cinematic tour",

    // Navigation bar & Playback
    navOrbit: "1 finger orbit",
    navZoom: "2 fingers zoom",
    navPan: "Shift + drag pan",
    simulatePlay: "Simulate",
    simulatePause: "Pause",
    logicNodes: "Logic",
    worldIR: "WorldIR",
    goldenHour: "Golden hour",
    naturalLight: "Natural light",

    // Prompt & Author Studio
    promptPlaceholder: "A space, objects, an interaction… Describe what you envision.",
    promptSubmit: "Enter to create (⇧+Enter newline)",
    giveLifeButton: "Bring my world to life",
    creatingWorld: "Creating world…",
    quickInspirations: "Quick inspirations",
    exploreAll: "Explore all →",
    searchPlaceholder: "Search an experience (e.g. Vuitton, café, battery...)",

    // ZeroClickLaunchpad
    guidedTourButton: "Launch guided tour (3 min)",
    guidedTourSubtitle: "Automated 5-act demonstration · Complete showcase",
    launchpadTitle: "Discovery mode · 0-click",
    launchpadSubtitle: "Verify an end-to-end interaction",
    launchpadDesc: "This prebuilt scenario demonstrates a scene, an interaction and available controls.",
    blankCanvas: "Blank canvas",
    blankCanvasTooltip: "Hide launchpad for a 100% unobstructed view",
    reopenLaunchpad: "Reopen experience launchpad (0-click)",
    loadSimulation: "⚡ Load simulation",
    observabilityGizmo: "Observability & gizmo [F2]",
    observabilityTooltip: "Open reactive observability inspector (flags, causal rules, 3D gizmo) [F2]",
    hackathonVictoria: "Victoria VR Hackathon",
    showcaseSupercarTitle: "Victoria VR showroom & supercar",
    showcaseSupercarBadge: "Guided demo · showcase scene",
    showcaseSupercarDesc: "Streamlined hypercar on a rotating platform, panoramic window overlooking the megapolis, VIP lounge, and pearl finish.",
    showcaseSupercarHighlights: ["Interactive 3D scene", "Visible rules", "Test and diagnosis"],

    // Observatory & Telemetry
    obsTitleCreator: "Observatory · Health & visual diagnosis",
    obsTitleResearch: "Observatory · Behavioral analysis cockpit",
    creatorModeBtn: "Creator mode (clean & visual)",
    researchModeBtn: "Researcher mode (formal & thesis)",
    tabDiagnosis: "🩺 1. Diagnosis & health",
    tabEmergent: "👆 2. Detected gestures & interactions",
    tabBlastRadius: "🛡️ 3. Stability & non-regression",
    tabPedagogy: "🎯 4. Ready quests & scenarios",
    tabTelemetry: "⏱️ 5. Activity & ergonomics",
    tabAdaptiveLoop: "🛰️ 1. Adaptive loop (meta-controller)",
    tabAffordances: "💡 2. Emergent affordances",
    tabSBR: "🛡️ 3. Semantic Blast Radius",
    tabBloom3D: "🎓 4. Pedagogical compiler (Bloom 3D)",
    tabMDPTensors: "📊 5. Spatial telemetry & MDP",

    // Guided tour notice
    guidedTourNoticeAct3: "Guided tour active · Observatory demo: real-time causal analysis and H1/H2 Bayesian beliefs.",
    guidedTourNoticeAct4: "Guided tour active · 4 Personas Benchmark: live comparison of Persona A (causal invariance) vs Persona B (heuristic).",
    guidedTourAutoNotice: "The tour will proceed automatically in a few moments.",

    // Acts short names
    act1Short: "1. Conception E1",
    act2Short: "2. Simulation",
    act3Short: "3. Observatory",
    act4Short: "4. Benchmark",
    act5Short: "5. Adaptation E2",

    // Benchmark & Personas
    benchmarkMatrixTitle: "4 Standardized cognitive personas benchmark matrix",
    benchmarkSubtitle: "Formal mathematical verification of Bayesian robustness against surface heuristic traps.",
    runAllBenchmarkBtn: "Run global benchmark (4 personas)",
    activeSimulation: "Active simulation",
    relaunch: "Rerun",
    simulate: "Simulate",
  }
};

export const useTranslation = (lang: UILanguage) => {
  return translations[lang] || translations.en;
};

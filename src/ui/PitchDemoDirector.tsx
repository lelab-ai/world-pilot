/**
 * src/ui/PitchDemoDirector.tsx
 * Automated Interactive Director for the 3-Minute Hackathon Demo Pitch
 * Orchestrates Acts 1 to 5 with live state transitions, camera choreography, teleprompter and auto-play.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWorldStore } from '../engine/store';
import { useDraggableModal } from './useDraggableModal';

export interface PitchAct {
  id: number;
  timeRange: string;
  durationSec: number;
  titleFr: string;
  titleEn: string;
  scriptFr: string;
  scriptEn: string;
  mode: 'conception' | 'simulation' | 'observatoire';
  actionFr: string;
  actionEn: string;
}

export interface PitchTrack {
  id: string;
  nameFr: string;
  nameEn: string;
  taglineFr: string;
  taglineEn: string;
  icon: string;
  themeColor: string;
  badge: string;
  acts: PitchAct[];
}

export const PITCH_ACTS: PitchAct[] = [
  {
    id: 1,
    timeRange: '00:00 - 00:30',
    durationSec: 30,
    titleFr: 'Acte 1 : Conception et synthèse de E1',
    titleEn: 'Act 1 : Conception and synthesis of E1',
    scriptFr:
      "Tous les générateurs d'IA savent aujourd'hui créer un décor 3D à partir d'un prompt. Mais une fois le monde généré, l'IA s'arrête là : elle n'apprend rien de vous. WorldPilot change fondamentalement ce paradigme. Notre thèse : un univers virtuel ne doit pas être généré une seule fois. Le système doit observer vos actions, comprendre ce que vous avez assimilé, et générer la seconde expérience, plus intelligente.",
    scriptEn:
      "Today, every generative AI model can create a 3D scene from a prompt. But once the world is spawned, the AI stops right there: it learns nothing about you. WorldPilot fundamentally shifts this paradigm. Our thesis: A virtual world must not be generated only once. The system must observe your actions, diagnose what you truly understood, and generate the second experience, smarter.",
    mode: 'conception',
    actionFr: "Compilation du laboratoire d'optique et affichage de l'Atelier Spatial.",
    actionEn: 'Compiling optical physics lab and presenting the Author Studio.',
  },
  {
    id: 2,
    timeRange: '00:30 - 01:15',
    durationSec: 45,
    titleFr: 'Acte 2 : Simulation immersive et actions utilisateur',
    titleEn: 'Act 2 : Immersive simulation and user actions',
    scriptFr:
      "Passons en mode Simulation. L'interface s'efface pour laisser place à l'immersion spatiale complète. Ici, l'utilisateur manipule les prismes, ajuste les faisceaux lumineux et résout le puzzle. Dans la simulation, l'agent est un compagnon spatial incarné : il guide l'utilisateur, répond à ses questions et observe le tempo de ses gestes avec des retours haptiques WebXR au millimètre.",
    scriptEn:
      "Let's switch to Simulation mode. The authoring UI fades away, leaving 100% of the screen for spatial immersion. Here, the user manipulates prisms, rotates optical emitters, and solves the challenge. In simulation, the agent is an embodied spatial companion: guiding the user, answering questions, and tracking subtle gesture latencies with millimeter-accurate WebXR haptics.",
    mode: 'simulation',
    actionFr: 'Bascule 100% plein écran, activation du guide spatial et centrage sur le banc.',
    actionEn: 'Switching to 100% full-screen immersion, spatial companion active, framing bench.',
  },
  {
    id: 3,
    timeRange: '01:15 - 01:45',
    durationSec: 30,
    titleFr: "Acte 3 : L'Observatoire et méta-contrôleur épistémique",
    titleEn: "Act 3 : L'Observatoire and epistemic meta-controller",
    scriptFr:
      "Bienvenue dans l'Observatory de WorldPilot. Les commandes visibles exécutent des exemples scénarisés H1/H2 et mettent à jour des jauges d'illustration. Elles montrent aussi une transition d'expérience E2. Ces valeurs ne sont pas des mesures en direct d'un utilisateur ni les résultats d'une étude.",
    scriptEn:
      "Welcome to WorldPilot's Observatory. The visible controls run scripted H1/H2 examples and update illustrative gauges. They can also show an E2 experience transition. These values are not live measurements of a participant or results from a user study.",
    mode: 'observatoire',
    actionFr: "Ouverture du Cockpit de l'Observatoire et affichage des jauges H1/H2 et de l'incertitude U.",
    actionEn: 'Opening the Observatory and showing its scripted H1/H2 example controls.',
  },
  {
    id: 4,
    timeRange: '01:45 - 02:20',
    durationSec: 35,
    titleFr: 'Acte 4 : Comparaison illustrative H1/H2',
    titleEn: 'Act 4 : Scripted H1/H2 illustration',
    scriptFr:
      "Les boutons H1 et H2 lancent deux exemples prédéfinis et mettent à jour les indicateurs de l'interface. Cette démonstration illustre le flux de l'Observatory ; elle ne constitue pas un benchmark de personas ni une mesure de compréhension causale.",
    scriptEn:
      "The H1 and H2 controls run two predefined examples and update the interface gauges. This illustrates the Observatory flow; it is not a persona benchmark or a measurement of causal understanding.",
    mode: 'observatoire',
    actionFr: 'Exécution des deux commandes d’exemple H1 et H2.',
    actionEn: 'Running the two scripted H1 and H2 examples.',
  },
  {
    id: 5,
    timeRange: '02:20 - 03:00',
    durationSec: 40,
    titleFr: "Acte 5 : Génération de l'expérience adaptée E2 et clôture",
    titleEn: 'Act 5 : Generation of adaptive experience E2 and conclusion',
    scriptFr:
      "Le bouton de transition applique l'exemple E2 scénarisé dans la scène active. WorldPilot propose aussi un export JSON de démonstration pour LeRobot. Les vérifications locales ne sont ni une certification Victoria VR ni une validation robotique sur matériel réel.",
    scriptEn:
      "The transition button applies the scripted E2 example to the current scene. WorldPilot also offers a sample LeRobot JSON export. Local checks are not Victoria VR certification or validation on a physical robot.",
    mode: 'simulation',
    actionFr: 'Affichage de la transition E2 scénarisée.',
    actionEn: 'Showing the scripted E2 transition.',
  },
];

/**
 * PITCH TRACK 2: HAUTE GASTRONOMIE & ATELIER ESCOFFIER
 */
export const GASTRONOMY_ACTS: PitchAct[] = [
  {
    id: 1,
    timeRange: '00:00 - 00:30',
    durationSec: 30,
    titleFr: 'Acte 1 : Mise en place et prémices culinaires',
    titleEn: 'ACT 1: Culinary Mise en Place & Setup',
    scriptFr:
      "Bienvenue dans l'Atelier Gastronomique Auguste Escoffier. Ici, la cuisine ne se contente pas d'être belle : chaque ingrédient obéit à la physique spatiale. Plan de travail en marbre adouci, cocotte en fonte émaillée Le Creuset, couteau d'office et légumes de Provence fraîchement cueillis. L'avatar du Chef vous accueille, et le tableau de projection interactif affiche la recette guidée que vous pouvez déplacer d'un simple geste.",
    scriptEn:
      "Welcome to the Auguste Escoffier Culinary Workshop. Here, cooking is not just visual: every ingredient obeys spatial physics. Honed marble island, enamelled Le Creuset cast-iron cocotte, paring knife and freshly harvested vegetables. The Chef avatar greets you, and the interactive projection board displays the step-by-step recipe, moveable with a single gesture.",
    mode: 'conception',
    actionFr: 'Disposition du plan de travail, de la cocotte rouge et des légumes frais.',
    actionEn: 'Setting up workbench, cocotte and fresh organic ingredients.',
  },
  {
    id: 2,
    timeRange: '00:30 - 01:15',
    durationSec: 45,
    titleFr: 'Acte 2 : Découpe, mijotage et gestes haptiques',
    titleEn: 'ACT 2: Knife Chopping, Simmering & Haptic Gestures',
    scriptFr:
      "Passons à l'action en mode Simulation ! Observez la précision : nous saisissons les courgettes et tomates pour les découper sur la planche. Les cubes de brunoise apparaissent en 3D. Nous les glissons dans la cocotte avec un aimantage magnétique fluide. Allumons le feu doux : la vapeur s'élève, le crépitement audio spatialisé retentit et l'infusion du bouquet garni fait grimper le thermomètre de cuisson.",
    scriptEn:
      "Let's move into Simulation mode! Observe the tactile precision: we slice courgettes and ripe tomatoes on the board. 3D diced cubes appear instantly. Magnetic snapping drops them seamlessly into the cocotte. We ignite gentle heat: procedural steam rises, spatialised sizzling sounds fill the room, and herb infusion raises the live cooking thermometer.",
    mode: 'simulation',
    actionFr: 'Découpe des légumes, immersion dans la cocotte et élévation de vapeur.',
    actionEn: 'Chopping vegetables, plunging into cocotte, procedural steam rises.',
  },
  {
    id: 3,
    timeRange: '01:15 - 01:45',
    durationSec: 30,
    titleFr: "Acte 3 : Observatoire sensoriel et charge cognitive",
    titleEn: 'ACT 3: Sensory Observatoire & Cognitive Balance',
    scriptFr:
      "Ouvrons L'Observatoire Culinaire. Le moteur analyse en direct l'assaisonnement et le profil organoleptique : équilibre sel-huile-aromates, courbe de température de mijotage et indice de charge cognitive de la brigade. Deux hypothèses s'affrontent : le cuisinier agit-il par précipitation superficielle (H1) ou maîtrise-t-il la thermodynamique des sucs (H2) ?",
    scriptEn:
      "Let's open the Sensory Observatoire. The engine tracks real-time seasoning and organoleptic balance: salt-oil-herb ratio, simmering curve, and cognitive load index. Two hypotheses compete: is the cook rushing on surface cues (H1), or truly mastering sauce thermodynamics (H2)?",
    mode: 'observatoire',
    actionFr: 'Affichage des jauges organoleptiques et de la matrice thermodynamique.',
    actionEn: 'Opening sensory radar and thermodynamic temperature telemetry.',
  },
  {
    id: 4,
    timeRange: '01:45 - 02:20',
    durationSec: 35,
    titleFr: 'Acte 4 : Stress-test et coup de feu thermique',
    titleEn: 'ACT 4: Stress-Testing & Thermal Flare Anomaly',
    scriptFr:
      "Injectons une anomalie critique : 'Coup de feu thermique à 210°C !'. La cocotte s'embrase sous une alerte rouge. Grâce aux conseils vocaux du Chef Auguste et aux boutons rapides d'allure de chauffe, nous ramenons instantanément la flamme à feu doux et ajoutons un filet d'huile d'olive protecteur. Le système enregistre l'adaptation réflexe réussie.",
    scriptEn:
      "Let's inject an emergency stress test: 'Thermal flare up to 210°C!'. The cocotte flashes in warning red. Guided by Chef Auguste's synthesized voice and one-click heat throttles, we immediately ease the burner and pour protective olive oil. The cognitive recorder captures this flawless reflex recovery.",
    mode: 'observatoire',
    actionFr: 'Déclenchement du coup de feu thermique et régulation réflexe au feu doux.',
    actionEn: 'Triggering thermal flare anomaly and successfully calming the burner.',
  },
  {
    id: 5,
    timeRange: '02:20 - 03:00',
    durationSec: 40,
    titleFr: 'Acte 5 : Dressage gastronomique 3★ et dégustation',
    titleEn: 'ACT 5: 3-Star Plating & Final Sensory Tasting',
    scriptFr:
      "Clôture magistrale : nous cliquons sur 'Dresser l'assiette'. La ratatouille s'ordonne en un tian élégant sur porcelaine de Limoges, couronné d'une tuile dentelle croustillante et nappé d'un cordon de réduction au jus. La dégustation animée à la fourchette 3D déclenche la note sensorielle de 98/100 et l'éloge d'un critique trois étoiles Michelin !",
    scriptEn:
      "Grand finale: we click 'Plate Dish'. The ratatouille forms an exquisite gastronomic tian on Limoges porcelain, crowned with lace tuile and glossy reduction sauce. 3D animated fork tasting evaluates to a stellar 98/100 score, accompanied by Michelin inspector acclaim and celebratory fanfare!",
    mode: 'simulation',
    actionFr: 'Dressage gastronomique en tian, animation de dégustation et fanfare 3★.',
    actionEn: 'Gastronomic tian plating, fork tasting animation, 3-star fanfare.',
  },
];

/**
 * PITCH TRACK 3: MAISON VENDÔME & HAUTE HORLOGERIE / MAROQUINERIE
 */
export const LUXURY_ACTS: PitchAct[] = [
  {
    id: 1,
    timeRange: '00:00 - 00:30',
    durationSec: 30,
    titleFr: 'Acte 1 : Écrin privé et malle mythique Vendôme',
    titleEn: 'ACT 1: Private Salon & Iconic Vendôme Trunk',
    scriptFr:
      "Pénétrez dans les salons privés de la Maison Vendôme. Un espace tamisé aux boiseries nobles, où trône la malle de voyage iconique Monogram et un podium d'exposition en laiton brossé. Notre conseillère spatiale incarnée, Éléonore, vous souhaite la bienvenue. WorldPilot démontre ici sa puissance pour le retail de grand luxe et le métavers patrimonial.",
    scriptEn:
      "Step into the private salons of Maison Vendôme. A refined boutique with warm oak paneling, showcasing an iconic Monogram wardrobe trunk on a brushed brass pedestal. Our embodied client advisor, Éléonore, welcomes you. WorldPilot demonstrates its sheer power for ultra-luxury retail and digital twin heritage.",
    mode: 'conception',
    actionFr: 'Ouverture du salon VIP Vendôme et mise en scène de la malle de voyage.',
    actionEn: 'Opening luxury VIP lounge and staging handcrafted heritage trunk.',
  },
  {
    id: 2,
    timeRange: '00:30 - 01:15',
    durationSec: 45,
    titleFr: 'Acte 2 : Inspection PBR, cuir Togo et gemmologie',
    titleEn: 'ACT 2: PBR Material Inspection & Diamond Facets',
    scriptFr:
      "Mode Simulation active. Approchons la loupe de joaillerie : les reflets spéculaires caressent les ferrures dorées, le grain du cuir Togo réagit à la lumière zénithale sans aucun éblouissement laiteux. L'utilisateur peut tester différents matériaux PBR pré-calibrés en temps réel et manipuler les parures précieuses avec une stabilité haptique absolue.",
    scriptEn:
      "Active Simulation mode. Bring the gemmological loupe closer: subtle specular reflections trace golden brass corners, and Togo leather grain responds naturally under zenithal lighting with zero milky glare. The user tests pre-calibrated PBR materials in real-time, holding fine jewelry with sub-millimeter haptic poise.",
    mode: 'simulation',
    actionFr: 'Zoom macro sur les coutures sellier et éclat des ferrures laiton.',
    actionEn: 'Macro zoom on saddle stitching and sparkling golden hardware.',
  },
  {
    id: 3,
    timeRange: '01:15 - 01:45',
    durationSec: 30,
    titleFr: "Acte 3 : Observatoire d'authenticité et passeport numérique",
    titleEn: 'ACT 3: Authenticity Observatoire & Digital Passport',
    scriptFr:
      "L'Observatoire du Luxe entre en scène : nous vérifions le passeport numérique inviolable de la création. Le Méta-Contrôleur analyse l'expertise de l'auditeur : sait-il reconnaître l'authenticité d'un point sellier fait main (H2) ou s'arrête-t-il au simple logo imprimé (H1) ? L'incertitude épistémique converge vers une confiance absolue.",
    scriptEn:
      "The Luxury Observatoire opens: we inspect the immutable digital product passport. The Meta-Controller evaluates the appraiser's connoisseurship: can they verify genuine saddle-stitch craftsmanship (H2), or rely on printed logos (H1)? Epistemic uncertainty converges toward total confidence.",
    mode: 'observatoire',
    actionFr: 'Affichage du passeport numérique blockchain et scoring d’intégrité.',
    actionEn: 'Displaying blockchain digital passport and craftsmanship score.',
  },
  {
    id: 4,
    timeRange: '01:45 - 02:20',
    durationSec: 35,
    titleFr: 'Acte 4 : Détection de contrefaçon et test de résistance',
    titleEn: 'ACT 4: Counterfeit Stress-Test & Resilience Audit',
    scriptFr:
      "Épreuve de stress : nous injectons un spécimen suspect aux micro-imperfections dissimulées. Grâce à l'analyseur spectral spatial, le système met en exergue l'écart de densité du cuir et l'inversion d'alignement des rivets. Le diagnostic formel confirme la contrefaçon en moins de 15 secondes.",
    scriptEn:
      "Stress test challenge: we inject a suspicious sample with concealed micro-flaws. Using the spatial spectral scanner, the engine flags leather density divergence and inverted rivet spacing. Formal diagnosis confirms counterfeit detection in under 15 seconds.",
    mode: 'observatoire',
    actionFr: 'Scan microscopique et mise en lumière des micro-anomalies sellier.',
    actionEn: 'Microscopic scan pinpointing saddle stitching anomalies.',
  },
  {
    id: 5,
    timeRange: '02:20 - 03:00',
    durationSec: 40,
    titleFr: 'Acte 5 : Scellement NFT Victoria VR et célébration VIP',
    titleEn: 'ACT 5: Victoria VR NFT Seal & VIP Handover',
    scriptFr:
      "Dénouement exclusif : nous scellons le jumeau numérique dans la blockchain Victoria VR Lands. Gravure laser dorée des initiales du client, remise des gants de maître maroquinier par Éléonore et émission d'un certificat d'authenticité éternel. Le luxe spatial trouve son standard ultime !",
    scriptEn:
      "Exclusive handover: we seal the digital twin on Victoria VR Lands blockchain. Golden laser engraving of customer monogram, master leathercraft gloves offered by advisor Éléonore, and eternal certificate minted. Spatial luxury achieves its pinnacle standard!",
    mode: 'simulation',
    actionFr: 'Scellement du jumeau NFT, gravure dorée et félicitations d’Éléonore.',
    actionEn: 'Minting NFT twin, golden laser monogram, Éléonore congratulations.',
  },
];

/**
 * PITCH TRACK 4: AÉROSPATIALE MARTIENNE ZÉRO-G
 */
export const AEROSPACE_ACTS: PitchAct[] = [
  {
    id: 1,
    timeRange: '00:00 - 00:30',
    durationSec: 30,
    titleFr: 'Acte 1 : Sas orbital et base martienne Argyre',
    titleEn: 'ACT 1: Orbital Airlock & Argyre Martian Habitat',
    scriptFr:
      "Cap sur la planète rouge ! Nous initialisons le laboratoire aérospatial de la base Argyre Planitia. Sas de dépressurisation, propulseur ionique à xénon en lévitation magnétique, moniteurs de télémétrie orbitale et combinaison spatiale pressurisée. L'avatar de l'ingénieure de vol Nova se synchronise avec vos mouvements.",
    scriptEn:
      "Heading to the Red Planet! We initialize the Argyre Planitia aerospace laboratory. Airlock decompression chamber, magnetically levitated xenon ion thruster, orbital telemetry displays, and pressurized flight suit. Flight engineer avatar Nova synchronizes with your posture.",
    mode: 'conception',
    actionFr: 'Mise en place de la station orbitale, propulseur ionique et sas EVA.',
    actionEn: 'Deploying orbital airlock, xenon thruster and mission consoles.',
  },
  {
    id: 2,
    timeRange: '00:30 - 01:15',
    durationSec: 45,
    titleFr: 'Acte 2 : Sortie EVA, microgravité et manœuvres zéro-G',
    titleEn: 'ACT 2: Spacewalk EVA & Zero-G Thruster Calibration',
    scriptFr:
      "Dépressurisation en cours ! En mode Simulation, la physique bascule en microgravité réaliste. Les composants flottent avec inertie newtonienne. Vous saisissez les électrodes du propulseur, réalignez les buses de xénon et activez les faisceaux de plasma bleu. Les retours de force haptiques traduisent la masse et l'absence de frottement atmosphérique.",
    scriptEn:
      "Decompression underway! In Simulation mode, physics transition to authentic microgravity. Components drift with Newtonian inertia. You grab thruster electrodes, align xenon nozzles, and ignite bright blue plasma beams. Haptic force feedback conveys inertia and vacuum resistance.",
    mode: 'simulation',
    actionFr: 'Allumage du plasma ionique bleu et flottement en microgravité.',
    actionEn: 'Igniting blue ion plasma and floating in authentic microgravity.',
  },
  {
    id: 3,
    timeRange: '01:15 - 01:45',
    durationSec: 30,
    titleFr: "Acte 3 : Télémétrie orbitale et observatoire des pannes",
    titleEn: 'ACT 3: Orbital Telemetry & Fault Observatoire',
    scriptFr:
      "Ouvrons L'Observatoire de Mission. La télémétrie en temps réel affiche le débit massique de xénon, l'impulsion spécifique Isp (3200s) et le vecteur de poussée. Le Méta-Contrôleur modélise l'aptitude de l'astronaute face aux lois orbitales de Kepler (H2) contre les réflexes terrestres trompeurs (H1).",
    scriptEn:
      "Opening Mission Observatoire. Real-time telemetry tracks xenon mass flow, specific impulse Isp (3200s), and thrust vectoring. The Meta-Controller evaluates the astronaut's Keplerian orbital mechanics intuition (H2) versus misleading terrestrial instincts (H1).",
    mode: 'observatoire',
    actionFr: 'Affichage des jauges de poussée mN et de la trajectoire d’orbite.',
    actionEn: 'Displaying mN thrust gauges and Keplerian orbital vector map.',
  },
  {
    id: 4,
    timeRange: '01:45 - 02:20',
    durationSec: 35,
    titleFr: "Acte 4 : Fuite caloporteuse et procédure d'urgence",
    titleEn: 'ACT 4: Coolant Breach & Emergency Recovery Drill',
    scriptFr:
      "Alerte rouge : 'Chute de pression dans la boucle caloportrice !'. Les alarmes stroboscopiques s'embrasent. L'utilisateur isole la section défaillante par commande manuelle, purge le circuit secondaire et stabilise la température des aimants supraconducteurs avant l'emballement thermique.",
    scriptEn:
      "Red alert: 'Pressure drop detected in primary coolant loop!'. Warning strobes flash. Guided by protocol, the user isolates the breach valve, purges the secondary manifold, and re-stabilizes superconducting magnet temperatures before thermal runaway.",
    mode: 'observatoire',
    actionFr: 'Gestion de l’avarie caloportrice et stabilisation de la pression.',
    actionEn: 'Isolating coolant breach and stabilizing manifold pressure.',
  },
  {
    id: 5,
    timeRange: '02:20 - 03:00',
    durationSec: 40,
    titleFr: 'Acte 5 : Injection trans-martienne réussie et victoire',
    titleEn: 'ACT 5: Trans-Mars Injection Burn & Mission Success',
    scriptFr:
      "Succès total de mission : le propulseur ionique délivre son delta-v nominal. L'orbite martienne se verrouille sur les écrans de navigation spatiale, Nova célèbre votre qualification de pilote interstellaire et la télémétrie est certifiée pour le dataset robotique LeRobot !",
    scriptEn:
      "Full mission triumph: the ion engine delivers its nominal delta-v. The trans-Mars trajectory locks on orbital displays, Nova salutes your interplanetary pilot certification, and telemetry is officially certified for LeRobot robotics dataset!",
    mode: 'simulation',
    actionFr: 'Verrouillage de l’orbite martienne et félicitations de l’équipage.',
    actionEn: 'Locking Mars orbital capture and celebrating crew certification.',
  },
];

/**
 * PITCH TRACK 5: IMMERSION LINGUISTIQUE & FLE PARISIENNE
 */
export const FLE_ACTS: PitchAct[] = [
  {
    id: 1,
    timeRange: '00:00 - 00:30',
    durationSec: 30,
    titleFr: 'Acte 1 : Terrasse de café parisien et cadre de vie',
    titleEn: 'ACT 1: Parisian Café Terrace & Conversational Setting',
    scriptFr:
      "Bienvenue au Café Saint-Germain, en plein cœur de Paris. Guéridons en fonte, chaises bistrot en rotin tressé, comptoir en zinc et ardoise du jour. Notre guide parisien Jean s'avance avec un sourire bienveillant. WorldPilot transforme ici l'apprentissage du Français Langue Étrangère (FLE) en une immersion culturelle et spatiale vivante.",
    scriptEn:
      "Welcome to Café Saint-Germain in the heart of Paris. Cast-iron bistro tables, woven wicker chairs, zinc bar counter and daily specials blackboard. Parisian guide Jean approaches with a warm smile. WorldPilot transforms French as a Foreign Language (FLE) into an embodied, cultural 3D immersion.",
    mode: 'conception',
    actionFr: 'Génération du décor bistrot parisien et apparition du serveur Jean.',
    actionEn: 'Spawning Parisian café terrace and embodied companion Jean.',
  },
  {
    id: 2,
    timeRange: '00:30 - 01:15',
    durationSec: 45,
    titleFr: 'Acte 2 : Dialogue oral, visèmes labiaux et phonétique',
    titleEn: 'ACT 2: Spoken Dialogue, Lip Visemes & Phonetics',
    scriptFr:
      "Engageons la conversation en mode Simulation ! Observez la synchronisation labiale de Jean : bilabiales P/B/M, voyelles ouvertes, micro-saccades oculaires naturelles et gestuelle co-speech des mains. L'utilisateur s'exerce à commander son espresso et un croissant chaud avec retour phonétique instantané à cadence normale ou lente.",
    scriptEn:
      "Let's start the dialogue in Simulation mode! Notice Jean's authentic lip sync: bilabial closures, open vowels, natural saccadic gaze, and co-speech hand gestures. The learner practices ordering an espresso and warm croissant with real-time phonetic feedback at natural or slow 0.75x cadence.",
    mode: 'simulation',
    actionFr: 'Animation des visèmes labiaux et échange vocal vivant avec Jean.',
    actionEn: 'Animating acoustic phoneme visemes and live speech exchange.',
  },
  {
    id: 3,
    timeRange: '01:15 - 01:45',
    durationSec: 30,
    titleFr: "Acte 3 : Observatoire linguistique et progression CECRL",
    titleEn: 'ACT 3: Linguistic Observatoire & CEFR Progression',
    scriptFr:
      "Ouvrons L'Observatoire Linguistique. Le Méta-Contrôleur analyse la fluidité syntaxique, la prosodie et le temps de latence avant réponse. Deux hypothèses s'affrontent : l'apprenant traduit-il mot-à-mot depuis sa langue maternelle (H1) ou pense-t-il directement en structures idiomatiques françaises (H2) ?",
    scriptEn:
      "Opening Linguistic Observatoire. The Meta-Controller evaluates syntactic fluency, prosody, and response latency. Competing hypotheses: is the learner translating word-for-word from their native tongue (H1), or thinking directly in fluent French idiomatic constructs (H2)?",
    mode: 'observatoire',
    actionFr: 'Affichage du radar de compétences CECRL A1/B2 et de la prosodie.',
    actionEn: 'Opening CEFR skill radar and phonetic prosody analytics.',
  },
  {
    id: 4,
    timeRange: '01:45 - 02:20',
    durationSec: 35,
    titleFr: 'Acte 4 : Défi flashcards et pièges idiomatiques',
    titleEn: 'ACT 4: 3D Flashcard Challenge & Idiom Mastery',
    scriptFr:
      "Défi interactif : 'Commander l'addition sans commettre de faux-ami'. Les flashcards 3D flottantes permettent de réviser la prononciation des termes complexes. L'utilisateur valide les 5 expressions clés d'affilée, faisant basculer la probabilité bayésienne P(H2) à plus de 98% !",
    scriptEn:
      "Interactive drill: 'Asking for the bill without false-friend traps'. Floating 3D flashcards let the user review complex pronunciations. Nailing 5 consecutive idiomatic expressions drives Bayesian belief P(H2) beyond 98%!",
    mode: 'observatoire',
    actionFr: 'Résolution des flashcards de vocabulaire et bascule bayésienne H2.',
    actionEn: 'Validating 3D vocabulary flashcards and Bayesian belief surge.',
  },
  {
    id: 5,
    timeRange: '02:20 - 03:00',
    durationSec: 40,
    titleFr: 'Acte 5 : Échange spontané et remise du badge de maîtrise',
    titleEn: 'ACT 5: Spontaneous Fluency & French Culture Badge',
    scriptFr:
      "Apothéose de la leçon : Jean félicite l'étudiant pour son aisance naturelle, lui tend l'espresso fumant sur une coupelle en faïence et lui décerne le Badge de Compétence Conversationnelle FLE Parisienne. L'apprentissage spatial réconcilie humanisme, rigueur linguistique et émerveillement 3D !",
    scriptEn:
      "Lesson culmination: Jean warmly congratulates the student on natural fluency, serving a steaming espresso on ceramic saucer and awarding the Parisian Conversational Fluency Badge. Spatial education unites humanism, linguistic rigor, and 3D wonder!",
    mode: 'simulation',
    actionFr: 'Remise du badge de maîtrise culturelle et toast avec le guide Jean.',
    actionEn: 'Awarding conversational badge and celebratory toast with Jean.',
  },
];

/**
 * COMPLETE CATALOG OF 5 SCENARIZED TRACKS
 */
export const PITCH_TRACKS: PitchTrack[] = [
  {
    id: 'deep_tech',
    nameFr: 'Deep tech et optique',
    nameEn: 'Deep Tech & Optics',
    taglineFr: 'Laboratoire de physique et méta-contrôleur bayésien',
    taglineEn: 'Optical Physics Lab & Bayesian Meta-Controller',
    icon: '🔬',
    themeColor: '#38bdf8',
    badge: 'Parcours de référence',
    acts: PITCH_ACTS,
  },
  {
    id: 'haute_gastronomie',
    nameFr: 'Haute gastronomie',
    nameEn: 'Fine Gastronomy',
    taglineFr: 'Atelier Escoffier, découpe, mijotage thermique et dressage 3★',
    taglineEn: 'Escoffier Workshop, Slicing, Heat Simmering & 3★ Plating',
    icon: '🥘',
    themeColor: '#f59e0b',
    badge: 'Art Culinaire',
    acts: GASTRONOMY_ACTS,
  },
  {
    id: 'luxe_vendome',
    nameFr: 'Maison Vendôme',
    nameEn: 'Maison Vendôme',
    taglineFr: 'Haute maroquinerie, gemmologie et passeport numérique blockchain',
    taglineEn: 'Leather Craftsmanship, Gemmology & Blockchain Passport',
    icon: '💎',
    themeColor: '#fbbf24',
    badge: 'Luxe & Horlogerie',
    acts: LUXURY_ACTS,
  },
  {
    id: 'aerospatiale',
    nameFr: 'Aérospatiale martienne',
    nameEn: 'Mars Aerospace',
    taglineFr: 'Base Argyre, propulsion ionique xénon, sas EVA et zéro-G',
    taglineEn: 'Argyre Base, Xenon Ion Thruster, EVA Airlock & Zero-G',
    icon: '🚀',
    themeColor: '#ef4444',
    badge: 'Mission Spatiale',
    acts: AEROSPACE_ACTS,
  },
  {
    id: 'fle_paris',
    nameFr: 'Immersion FLE Paris',
    nameEn: 'Parisian French Immersion',
    taglineFr: 'Café Saint-Germain, visèmes phonétiques et dialogue vivant',
    taglineEn: 'Café Saint-Germain, Acoustic Visemes & Spoken Dialogue',
    icon: '☕',
    themeColor: '#10b981',
    badge: 'Pédagogie FLE',
    acts: FLE_ACTS,
  },
];

interface PitchDemoDirectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const getShortActTitle = (id: number, lang: 'fr' | 'en') => {
  switch (id) {
    case 1: return lang === 'fr' ? '1. Conception E1' : '1. Conception E1';
    case 2: return lang === 'fr' ? '2. Simulation' : '2. Simulation';
    case 3: return lang === 'fr' ? '3. Observatoire' : '3. Observatory';
    case 4: return lang === 'fr' ? '4. Benchmark' : '4. Benchmark';
    case 5: return lang === 'fr' ? '5. Adaptation E2' : '5. Adaptation E2';
    default: return `Acte ${id}`;
  }
};

export const PitchDemoDirector: React.FC<PitchDemoDirectorProps> = ({ isOpen, onClose }) => {
  const [currentActIndex, setCurrentActIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedInAct, setElapsedInAct] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.5);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const { offset, isDragging, dragProps } = useDraggableModal();

  const language = useWorldStore((s) => s.uiLanguage);
  const setLanguage = useWorldStore((s) => s.setUiLanguage);
  const setPitchDirectorActId = useWorldStore((s) => s.setPitchDirectorActId);
  const [isTeleprompterExpanded, setIsTeleprompterExpanded] = useState<boolean>(false);

  const setAppMode = useWorldStore((s) => s.setAppMode);
  const setCameraPreset = useWorldStore((s) => s.setCameraPreset);
  const compileAndLoadPedagogicalSimulation = useWorldStore((s) => s.compileAndLoadPedagogicalSimulation);
  const triggerAdaptiveCycle = useWorldStore((s) => s.triggerAdaptiveCycle);
  const runPersonaBenchmark = useWorldStore((s) => s.runPersonaBenchmark);
  const resetMetaLoop = useWorldStore((s) => s.resetMetaLoop);
  const openResearchDashboard = useWorldStore((s) => s.openResearchDashboard);
  const closeResearchDashboard = useWorldStore((s) => s.closeResearchDashboard);

  const timerRef = useRef<any>(null);

  const currentAct = PITCH_ACTS[currentActIndex];

  // Apply act environment actions
  const applyActActions = (actIdx: number) => {
    const act = PITCH_ACTS[actIdx];
    if (!act) return;

    setPitchDirectorActId(act.id);
    setAppMode(act.mode);

    if (act.id === 1) {
      closeResearchDashboard();
      useWorldStore.setState({ isPlaytesterVisualizerActive: false });
      compileAndLoadPedagogicalSimulation('optics_snell');
      setCameraPreset('overview');
    } else if (act.id === 2) {
      closeResearchDashboard();
      useWorldStore.setState({ isPlaytesterVisualizerActive: false });
      setCameraPreset('table');
    } else if (act.id === 3) {
      // Act 3: Live Observatoire & Bayesian Meta-Controller
      useWorldStore.setState({ isPlaytesterVisualizerActive: false });
      openResearchDashboard();
      setCameraPreset('table');
    } else if (act.id === 4) {
      // Act 4: Standardized 4 Personas Benchmark & 3D Playtester Trajectories
      openResearchDashboard();
      resetMetaLoop();
      setCameraPreset('overview');
      useWorldStore.setState({ isPlaytesterVisualizerActive: true });
      runPersonaBenchmark('persona_b');
      setTimeout(() => {
        runPersonaBenchmark('persona_a');
      }, 1000);
    } else if (act.id === 5) {
      // Act 5: E2 Adaptive Generation
      closeResearchDashboard();
      useWorldStore.setState({ isPlaytesterVisualizerActive: false });
      triggerAdaptiveCycle();
      setCameraPreset('overview');
    }
  };

  const handleSelectAct = (actIdx: number) => {
    setCurrentActIndex(actIdx);
    setElapsedInAct(0);
    applyActActions(actIdx);
  };

  const handleNextAct = () => {
    if (currentActIndex < PITCH_ACTS.length - 1) {
      handleSelectAct(currentActIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevAct = () => {
    if (currentActIndex > 0) {
      handleSelectAct(currentActIndex - 1);
    }
  };

  const cyclePlaybackSpeed = () => {
    setPlaybackSpeed((prev) => {
      if (prev === 1.0) return 1.5;
      if (prev === 1.5) return 2.0;
      return 1.0;
    });
  };

  // Timer loop for autoplay with adjustable playbackSpeed (defaults to 1.5x)
  useEffect(() => {
    if (isPlaying && isOpen) {
      const tickInterval = Math.max(250, Math.round(1000 / playbackSpeed));
      timerRef.current = setInterval(() => {
        setElapsedInAct((prev) => {
          if (prev + 1 >= currentAct.durationSec) {
            handleNextAct();
            return 0;
          }
          return prev + 1;
        });
      }, tickInterval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentActIndex, isOpen, playbackSpeed]);

  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);

  const speakActScript = useCallback((act: PitchAct) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (!isVoiceActive) return;

      const text = language === 'fr' ? act.scriptFr : act.scriptEn;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';
      utterance.rate = Math.min(2.0, 1.05 * playbackSpeed);
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }, [isVoiceActive, language, playbackSpeed]);

  // Initial trigger when opening - auto-start playback and speech
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      applyActActions(currentActIndex);
    } else {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);

  // Speech narration sync
  useEffect(() => {
    if (isOpen && isPlaying) {
      speakActScript(currentAct);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isPlaying, currentActIndex, isOpen, isVoiceActive, speakActScript]);

  if (!isOpen) return null;

  const totalPitchDuration = 180;
  const currentTotalElapsed = PITCH_ACTS.slice(0, currentActIndex).reduce((acc, a) => acc + a.durationSec, 0) + elapsedInAct;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const actProgressPercent = Math.min(100, Math.round((elapsedInAct / currentAct.durationSec) * 100));
  const secondsLeftInAct = Math.max(0, currentAct.durationSec - elapsedInAct);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)`,
        zIndex: 65000,
        width: 'min(94vw, 860px)',
        maxWidth: '860px',
        boxSizing: 'border-box',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1.5px solid rgba(56, 189, 248, 0.5)',
        borderRadius: '16px',
        boxShadow: isDragging
          ? '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.4)'
          : '0 16px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.25)',
        backdropFilter: 'blur(20px)',
        padding: isMinimized ? '10px 16px' : '14px 18px',
        color: '#f8fafc',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease, padding 0.2s ease',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Header / Drag Bar */}
      <div
        {...dragProps}
        style={{
          ...dragProps.style,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMinimized ? '0' : '10px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      >
        {/* Left: Drag grip, live indicator, title, and current act */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span
            title={language === 'fr' ? 'Glisser pour déplacer le bandeau' : 'Drag to reposition companion'}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              color: '#38bdf8',
              fontSize: '14px',
              padding: '2px 4px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.1)',
            }}
          >
            ⠿
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 7px',
              borderRadius: '999px',
              fontSize: '10.5px',
              fontWeight: 700,
              background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
              color: isPlaying ? '#ef4444' : '#eab308',
              border: isPlaying ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(234, 179, 8, 0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isPlaying ? '#ef4444' : '#eab308',
                boxShadow: isPlaying ? '0 0 6px #ef4444' : 'none',
              }}
            />
            {isPlaying
              ? (language === 'fr' ? 'En direct' : 'Live')
              : (language === 'fr' ? 'Pause' : 'Paused')}
          </span>

          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              <span style={{ color: '#38bdf8', marginRight: '6px' }}>
                {language === 'fr' ? `Acte ${currentAct.id}/5 :` : `Act ${currentAct.id}/5:`}
              </span>
              {language === 'fr'
                ? currentAct.titleFr.split(':')[1]?.trim() || currentAct.titleFr
                : currentAct.titleEn.split(':')[1]?.trim() || currentAct.titleEn}
            </span>
          </div>
        </div>

        {/* Right: Controls, Speed, Voice, Play/Pause, Skip, Language, Minimize, Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap', marginRight: '2px' }}>
            ⏱ {secondsLeftInAct}s ({formatTime(currentTotalElapsed)} / {formatTime(totalPitchDuration)})
          </span>

          {/* Speed Toggle (1x, 1.5x, 2x) */}
          <button
            onClick={cyclePlaybackSpeed}
            style={{
              background: playbackSpeed > 1 ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.06)',
              border: playbackSpeed > 1 ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: playbackSpeed > 1 ? '#38bdf8' : '#cbd5e1',
              padding: '3px 7px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title={language === 'fr' ? `Vitesse de lecture : ${playbackSpeed}x (Cliquer pour changer : 1x, 1.5x, 2x)` : `Playback speed: ${playbackSpeed}x (Click to cycle)`}
          >
            ⚡ {playbackSpeed}x
          </button>

          {/* Voice Toggle */}
          <button
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            style={{
              background: isVoiceActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isVoiceActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isVoiceActive ? '#38bdf8' : '#94a3b8',
              padding: '3px 7px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title={isVoiceActive ? (language === 'fr' ? 'Désactiver la voix-off' : 'Mute voiceover') : (language === 'fr' ? 'Activer la voix-off' : 'Unmute voiceover')}
          >
            {isVoiceActive ? (language === 'fr' ? '🔊 Voix' : '🔊 Voice') : (language === 'fr' ? '🔇 Muet' : '🔇 Mute')}
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #10b981, #059669)',
              border: isPlaying ? '1px solid #ef4444' : '1px solid #34d399',
              color: '#ffffff',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Prev Act */}
          <button
            onClick={handlePrevAct}
            disabled={currentActIndex === 0}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: currentActIndex === 0 ? '#64748b' : '#cbd5e1',
              padding: '3px 7px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: currentActIndex === 0 ? 'not-allowed' : 'pointer',
            }}
            title={language === 'fr' ? 'Acte précédent' : 'Previous act'}
          >
            ◀
          </button>

          {/* Next Act */}
          <button
            onClick={handleNextAct}
            disabled={currentActIndex === PITCH_ACTS.length - 1}
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: currentActIndex === PITCH_ACTS.length - 1 ? '#64748b' : '#38bdf8',
              padding: '3px 7px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: currentActIndex === PITCH_ACTS.length - 1 ? 'not-allowed' : 'pointer',
            }}
            title={language === 'fr' ? 'Acte suivant' : 'Next act'}
          >
            ▶
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '3px 6px',
              borderRadius: '6px',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title={language === 'fr' ? "Basculer la langue" : "Toggle language"}
          >
            {language === 'fr' ? '🇫🇷' : '🇬🇧'}
          </button>

          {/* Minimize / Expand Toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '3px 6px',
              borderRadius: '6px',
              fontSize: '10.5px',
              cursor: 'pointer',
            }}
            title={isMinimized ? (language === 'fr' ? 'Déplier le bandeau' : 'Expand companion') : (language === 'fr' ? 'Réduire le bandeau' : 'Minimize companion')}
          >
            {isMinimized ? '▲' : '▼'}
          </button>

          {/* Close / Exit */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '3px 7px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title={language === 'fr' ? 'Quitter le parcours guidé' : 'Exit guided tour'}
          >
            ✕
          </button>
        </div>
      </div>

      {/* When not minimized: Progress, timeline steps, teleprompter */}
      {!isMinimized && (
        <>
          {/* Act progress bar */}
          <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
            <div
              style={{
                height: '100%',
                width: `${actProgressPercent}%`,
                background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                transition: 'width 0.3s linear',
              }}
            />
          </div>

          {/* Observatory Guided Guidance Banner (concise) */}
          {currentAct.mode === 'observatoire' && (
            <div
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                fontSize: '11px',
                color: '#bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡</span>
                <span>
                  {currentAct.id === 3
                    ? (language === 'fr'
                        ? "Observatoire en direct · Analyse causale et croyances bayésiennes H1/H2 (scène 3D visible à gauche)."
                        : "Live Observatory · Causal analysis and H1/H2 Bayesian beliefs (3D scene visible on left).")
                    : (language === 'fr'
                        ? "Benchmark 4 personas · Trajectoires 3D comparatives Persona A vs Persona B."
                        : "4 Personas benchmark · 3D trajectories comparison Persona A vs Persona B.")}
                </span>
              </div>
              <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {language === 'fr' ? `Suite dans ${secondsLeftInAct}s ▶` : `Next in ${secondsLeftInAct}s ▶`}
              </span>
            </div>
          )}

          {/* Act Timeline Steps (5 clickable cards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: '6px',
              marginBottom: '8px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {PITCH_ACTS.map((act, idx) => {
              const isCurrent = idx === currentActIndex;
              const isPassed = idx < currentActIndex;
              const shortTitle = getShortActTitle(act.id, language);
              return (
                <div
                  key={act.id}
                  onClick={() => handleSelectAct(idx)}
                  style={{
                    background: isCurrent
                      ? 'rgba(56, 189, 248, 0.2)'
                      : isPassed
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isCurrent
                      ? '1.5px solid #38bdf8'
                      : isPassed
                      ? '1px solid rgba(34, 197, 94, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '5px 7px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                  title={language === 'fr' ? act.titleFr : act.titleEn}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px' }}>
                    <span style={{ fontWeight: 700, color: isCurrent ? '#38bdf8' : isPassed ? '#4ade80' : '#94a3b8', whiteSpace: 'nowrap' }}>
                      {language === 'fr' ? `Acte ${act.id}` : `Act ${act.id}`}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '8.5px', whiteSpace: 'nowrap' }}>{act.timeRange.split(' ')[0]}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: isCurrent ? '#ffffff' : '#cbd5e1',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {shortTitle}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Teleprompter / Live Script (collapsible) */}
          <div
            style={{
              background: 'rgba(10, 15, 30, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: isTeleprompterExpanded ? '8px 12px' : '5px 10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isTeleprompterExpanded ? '4px' : '0' }}>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎙️</span>
                <strong>{language === 'fr' ? 'Voix-off :' : 'Voiceover:'}</strong>
                <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '10.5px' }}>
                  [{language === 'fr' ? currentAct.actionFr : currentAct.actionEn}]
                </span>
              </div>
              <button
                onClick={() => setIsTeleprompterExpanded(!isTeleprompterExpanded)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '10.5px', cursor: 'pointer', padding: '1px 4px' }}
              >
                {isTeleprompterExpanded ? (language === 'fr' ? '▲ Réduire script' : '▲ Collapse script') : (language === 'fr' ? '▼ Voir script' : '▼ View script')}
              </button>
            </div>

            {isTeleprompterExpanded && (
              <p
                style={{
                  margin: 0,
                  fontSize: '11.5px',
                  lineHeight: 1.5,
                  color: '#f1f5f9',
                  fontStyle: 'italic',
                }}
              >
                "{language === 'fr' ? currentAct.scriptFr : currentAct.scriptEn}"
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};


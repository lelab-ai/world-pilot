// src/library/certifiedExperiences.ts
// Registre des expériences virtuelles officiellement certifiées et validées.
// Chaque expérience enregistrée ici a subi avec succès l'audit complet :
// 1. Réalisme des objets 3D (aucun fallback ni canard pour une voiture)
// 2. Causalité et règles complètes (sons, visuels, drapeaux)
// 3. Fluidité physique Rapier (mobilier lourd fixe, outils manipulables)
// 4. Ergonomie cognitive (points d'hésitation analysés et résolus)
// 5. Exécution sans accroc de la trace

export interface CertifiedExperience {
  id: string;
  prompt: string;
  promptEn?: string;
  title: string;
  titleEn?: string;
  category: 'Mécanique & Automobile' | 'Chimie & Sciences' | 'Cuisine & Gastronomie' | 'Physique & Électricité' | 'Bureautique & Réunion' | 'Mode & Luxe Showroom' | 'Métavers Victoria VR' | 'Aérospatial & Futurisme' | 'Ameublement & DIY' | 'Tech & Game Design' | 'Web3 & Innovation';
  categoryEn?: string;
  status: 'validated';
  auditScore: number; // ex: 98/100
  certifiedDate: string;
  thumbnailIcon: string;
  description: string;
  descriptionEn?: string;
  realisticObjects: string[];
  realisticObjectsEn?: string[];
  interactionHighlights: string[];
  interactionHighlightsEn?: string[];
  hesitationsResolved: string[];
  hesitationsResolvedEn?: string[];
  actionPresetCommand: string;
}

export const certifiedExperiencesRegistry: CertifiedExperience[] = [{
    id: 'cert_auto_battery_12v',
    prompt: 'Montrer comment changer une batterie dans une voiture',
    title: 'Remplacement de Batterie Automobile 12V AGM',
    category: 'Mécanique & Automobile',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-09-27',
    thumbnailIcon: '🚗',
    description: 'Procédure complète de maintenance en atelier : berline avec capot relevé, compartiment moteur complet avec bac récepteur et câbles (+) rouge / (-) noir, batterie neuve 12V 70Ah AGM sur établi.',
    realisticObjects: [
      'Voiture berline avec capot relevé et compartiment moteur complet (wp-voiture)',
      'Bac récepteur de batterie avec zone réceptrice aimantée',
      'Batterie automobile 12V 70Ah AGM avec poignée et voyant Magic Eye (wp-batterie-automobile)',
      'Établi technique de préparation (technical-bench)'
    ],
    interactionHighlights: [
      'Diagnostic préalable obligatoire : mesure de la tension (12.6V) avec son chime',
      'Glisser-déposer de la batterie dans le compartiment moteur avec verrouillage magnétique',
      'Raccordement des cosses, allumage automatique des phares LED et démarrage moteur',
      'Invariant formel de sécurité électrique interdisant la complétion sans diagnostic'
    ],
    hesitationsResolved: [
      'Ordre des opérations sécurisé par l’étape 1 de quête bien visible et boutons contextuels',
      'Repérage immédiat des cosses (+) rouge et (-) noire en modélisation 3D',
      'Possibilité de valider soit par glisser-déposer tactile, soit par les boutons d’action directe'
    ],
    actionPresetCommand: 'Montrer comment changer une batterie dans une voiture',
    titleEn: "12V AGM Automotive Battery Replacement",
    categoryEn: "Mechanics & Automotive",
    descriptionEn: "Full workshop maintenance procedure: sedan with open hood, complete engine bay with battery tray and (+) red / (-) black terminals, new 12V 70Ah AGM battery on technical bench.",
    realisticObjectsEn: [
      "Sedan car with raised hood and detailed engine bay (wp-voiture)",
      "Battery tray with magnetic alignment socket",
      "Automotive 12V 70Ah AGM battery with handle and Magic Eye indicator (wp-batterie-automobile)",
      "Preparation technical workbench (technical-bench)"
],
    interactionHighlightsEn: [
      "Mandatory pre-check diagnostic: resting voltage measurement (12.6V) with chime audio",
      "Drag & drop battery into engine bay with magnetic docking lock",
      "Terminal wiring connection, automatic LED headlights activation and engine start",
      "Formal electrical safety invariant preventing completion without pre-diagnostic"
],
    hesitationsResolvedEn: [
      "Procedural sequence enforced by step 1 quest banner and contextual action buttons",
      "Instant visual identification of (+) red and (-) black terminals in 3D",
      "Dual validation: either via direct 3D drag-and-drop or tactile action buttons"
],
  },
{
    id: 'cert_mindel_bag_capacity',
    prompt: 'Tester la capacité du Sac Voyageur Pro 42L et son compartiment ordinateur',
    title: 'Mindel Web 3D : Sac Voyageur Pro 42L & Test de Capacité Spatiale',
    category: 'Mode & Luxe Showroom',
    status: 'validated',
    auditScore: 100,
    certifiedDate: '2026-10-06',
    thumbnailIcon: '🎒',
    description: 'Démonstrateur central Mindel (Web 3D hybride sémantique) : Sac 42L avec parties sémantiques (housse ordi, cavité principale, poche gourde), bascule d’états ouvert/fermé, test géométrique de capacité spatiale pour Laptop 15.6", détection d’incompatibilité et fiches 2D enrichies.',
    realisticObjects: [
      'Sac Voyageur Pro 42L compartimenté (wp-sac-voyageur-42l)',
      'Ordinateur portable Pro 15.6 pouces (ordinateur)',
      'Gourde isotherme 750ml inox (wp-gourde-isotherme)',
      'Colis volumineux incompatible (wp-carton-oversized)',
      'Table showroom de présentation (table)'
    ],
    interactionHighlights: [
      'Bascule d’état sémantique ouvert/fermé sans simulation physique coûteuse',
      'Test de capacité spatiale en temps réel avec vérification géométrique 3D',
      'Recherche d’accessoires compatibles depuis l’objet sélectionné',
      'Sauvegarde et restauration explicite de dispositions spatiales nommées'
    ],
    hesitationsResolved: [
      'Réponse immédiate et sans ambiguïté à la question : "Est-ce que mon PC 15.6 rentre ?"',
      'Distingue clairement l’objet logique de ses représentations 3D',
      'Fiches de ressources 2D typées (notice d’entretien, gabarit cabine IATA, achat en 1 clic)'
    ],
    actionPresetCommand: 'Tester la capacité du Sac Voyageur Pro 42L et son compartiment ordinateur',
    titleEn: "Mindel 3D Web: Voyager Pro 42L Bag & Spatial Capacity Test",
    categoryEn: "Fashion & Luxury Showroom",
    descriptionEn: "Mindel showcase demonstrator (Hybrid Semantic 3D Web): 42L bag with semantic components (laptop sleeve, main cavity, water bottle pocket), open/closed state toggling, geometric 3D fit test for 15.6\" laptop, incompatibility detection, and rich 2D spec sheets.",
    realisticObjectsEn: [
      "Voyager Pro 42L compartmentalized travel bag (wp-sac-voyageur-42l)",
      "Pro 15.6-inch laptop computer (ordinateur)",
      "750ml stainless steel insulated water bottle (wp-gourde-isotherme)",
      "Oversized incompatible package (wp-carton-oversized)",
      "Showroom display presentation table (table)"
],
    interactionHighlightsEn: [
      "Semantic open/closed state transition without expensive physics simulation",
      "Real-time spatial capacity test with precise 3D geometric validation",
      "Compatible accessory discovery directly from selected entity",
      "Explicit save and restore of named 3D spatial layouts"
],
    hesitationsResolvedEn: [
      "Instant, unambiguous answer to: \"Does my 15.6-inch laptop fit?\"",
      "Clear distinction between logical entity and its multiple 3D representations",
      "Typed 2D resource sheets (care instructions, IATA cabin dimensions, 1-click purchase)"
],
  }];

export function getValidatedExperiences(): CertifiedExperience[] {
  return certifiedExperiencesRegistry.filter(exp => exp.status === 'validated');
}

export function registerValidatedExperience(exp: CertifiedExperience): void {
  const existingIdx = certifiedExperiencesRegistry.findIndex(e => e.id === exp.id);
  if (existingIdx >= 0) {
    certifiedExperiencesRegistry[existingIdx] = exp;
  } else {
    certifiedExperiencesRegistry.push(exp);
  }
}

for(let i=certifiedExperiencesRegistry.length-1;i>=0;i--)if(!["cert_auto_battery_12v", "cert_mindel_bag_capacity"].includes(certifiedExperiencesRegistry[i].id))certifiedExperiencesRegistry.splice(i,1);

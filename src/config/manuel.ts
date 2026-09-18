// ============================================================================
// CONFIG — MANUEL "ACADÉMIE BARMAN MOBILE"
// Modifiez uniquement les valeurs ci-dessous. Le lien Selar et le prix
// alimentent automatiquement la rubrique "Manuel" de la page /academie.
// ============================================================================

export const manuelConfig = {
  // Lien vérifié le 18/09/2026 : correspond bien à "Académie Barman Mobile —
  // Manuel Professionnel" sur Selar.
  selarUrl: "https://selar.com/05ij1o0004",

  priceFCFA: 18900 as number | null,

  pages: 97,
  chapters: 25,
  levels: 3,
  recipeSheets: 50,

  coverImage: {
    src: "/images/manuel-couverture.webp",
    alt: "Couverture du manuel Académie Barman Mobile",
  },
} as const;

export const manuelPersonas = [
  "Débutant souhaitant apprendre le métier",
  "Barman professionnel en activité",
  "Chef-barman",
  "Entrepreneur du bar mobile",
  "Professionnel de l'événementiel",
  "Hôtel, restaurant ou centre de formation",
];

export const manuelOutcomes = [
  "Organiser une station professionnelle",
  "Maîtriser les outils et les techniques du bar",
  "Réaliser des cocktails constants et équilibrés",
  "Travailler plus rapidement pendant le service",
  "Améliorer l'expérience client",
  "Calculer les coûts et contrôler les pertes",
  "Organiser un événement ou un bar mobile",
  "Former et diriger une équipe",
  "Construire une activité plus rentable",
];

export const manuelLevels = [
  {
    name: "Niveau 1 — Débutant",
    description:
      "Métier, hygiène, matériel, produits, techniques fondamentales et séquence de service.",
  },
  {
    name: "Niveau 2 — Intermédiaire",
    description:
      "Équilibre des recettes, techniques avancées, vitesse, vente, stocks, coûts, carte et événementiel.",
  },
  {
    name: "Niveau 3 — Renforcement",
    description:
      "Leadership, procédures, batching, achats, formation d'équipe, communication et rentabilité.",
  },
];

export const manuelRecipeSheetContents = [
  "Les ingrédients et les dosages",
  "La verrerie",
  "La technique",
  "L'exécution standard",
  "La finition",
  "Les erreurs à éviter",
  "Le contrôle qualité",
  "Le réflexe commercial",
  "Un carnet de dégustation",
];

export const manuelMaterial = [
  "Les douze outils indispensables",
  "Le matériel de station",
  "Le Kit Starter Barman Mobile",
  "Le Kit Professionnel Barman Mobile",
  "L'entretien du matériel",
  "Le programme pratique de 14 jours",
];

export const manuelReceives = [
  "Un manuel professionnel au format PDF",
  `${manuelConfig.pages} pages`,
  `${manuelConfig.recipeSheets} fiches cocktails`,
  "Des exercices pratiques",
  "Des tableaux et checklists",
  "Des outils d'évaluation",
  "Une livraison numérique assurée par Selar après le paiement",
];

export const manuelFaq = [
  {
    question: "Ce manuel convient-il aux débutants ?",
    answer:
      "Oui. Le Niveau 1 part des bases du métier (hygiène, matériel, séquence de service) et progresse ensuite vers des compétences plus avancées, jusqu'au leadership d'équipe au Niveau 3.",
  },
  {
    question: "Comment vais-je recevoir le PDF ?",
    answer:
      "Après votre achat sur Selar, le fichier PDF vous est livré automatiquement et numériquement par la plateforme, selon son propre processus de livraison.",
  },
  {
    question: "Le paiement est-il sécurisé ?",
    answer:
      "Le paiement et la livraison sont entièrement gérés par Selar, qui traite la transaction et l'envoi du fichier numérique.",
  },
  {
    question: "Puis-je consulter le manuel sur téléphone ?",
    answer:
      "Oui, le manuel est livré au format PDF et peut être consulté sur téléphone, tablette ou ordinateur.",
  },
  {
    question: "Existe-t-il une version imprimée ?",
    answer:
      "Non, le manuel est actuellement disponible uniquement au format numérique (PDF).",
  },
  {
    question: "Les kits de matériel sont-ils inclus ?",
    answer:
      "Non, les Kits Starter et Professionnel présentés dans le manuel sont des recommandations de matériel et ne sont pas inclus dans l'achat du manuel.",
  },
  {
    question: "Le manuel constitue-t-il un diplôme officiel ?",
    answer:
      "Non. Ce manuel est un outil de formation et d'auto-évaluation. Il ne remplace ni un diplôme d'État, ni une certification sanitaire, ni les autorisations professionnelles locales (âge légal, licences, hygiène, sécurité, fiscalité, publicité et responsabilité civile selon votre pays d'exercice).",
  },
  {
    question: "Puis-je suivre une formation pratique avec Barman Mobile Academy ?",
    answer:
      "Pour toute question sur un accompagnement pratique complémentaire, contactez directement Barman Mobile Group via la page contact du site.",
  },
];

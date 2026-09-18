// ============================================================================
// CONFIG — EBOOK "CRÉER ET RENTABILISER UN BAR MOBILE"
// Modifiez uniquement les valeurs ci-dessous. Le lien Selar est déjà actif
// (produit distinct du manuel de formation "Académie Barman Mobile").
// ============================================================================

export const ebookConfig = {
  // Lien vérifié le 18/09/2026 : correspond bien à "Créer et rentabiliser
  // un bar mobile en Afrique francophone" sur Selar.
  selarUrl: "https://selar.com/3r9s875751",

  // Le prix de ce produit est déjà fixé et affiché sur Selar. On ne le
  // duplique pas ici pour éviter tout écart si le prix change sur Selar
  // sans être répercuté sur le site.
  priceSetOnSelar: true,

  pages: 53,

  coverImage: {
    // 👉 Remplacez par le chemin réel une fois la couverture fournie,
    // ex : "/images/ebook-couverture.webp"
    src: "" as string,
    alt: "Couverture de l'eBook Créer et rentabiliser un bar mobile en Afrique francophone",
  },
} as const;

export const ebookPersonas = [
  "Entrepreneur souhaitant lancer une activité de bar mobile",
  "Barman voulant se mettre à son compte",
  "Professionnel de l'événementiel voulant diversifier son offre",
  "Toute personne intéressée par le business du bar mobile en Afrique francophone",
];

export const ebookOutcomes = [
  "Comprendre le fonctionnement d'une activité de bar mobile",
  "Structurer une offre claire pour vos clients",
  "Fixer des tarifs cohérents avec votre marché",
  "Trouver et fidéliser vos premiers clients",
  "Gérer le matériel, les stocks et la logistique",
  "Organiser vos prestations pour des événements",
  "Développer la rentabilité de votre activité",
  "Adapter votre modèle au contexte africain francophone",
];

export const ebookReceives = [
  "Un eBook au format PDF",
  `${ebookConfig.pages} pages`,
  "Des conseils pratiques et concrets",
  "Une livraison numérique assurée par Selar après le paiement",
];

export const ebookFaq = [
  {
    question: "Ce guide convient-il aux débutants ?",
    answer:
      "Oui. Le guide est pensé pour toute personne qui souhaite comprendre comment lancer et rentabiliser une activité de bar mobile, même sans expérience préalable.",
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
    question: "Quelle est la différence avec le manuel Académie Barman Mobile ?",
    answer:
      "Ce guide est centré sur la création et la rentabilité d'une activité de bar mobile (business, tarifs, clients, organisation). Le manuel Académie Barman Mobile, lui, forme au métier technique de barman : cocktails, standards de service et leadership d'équipe. Les deux sont complémentaires mais vendus séparément.",
  },
  {
    question: "Existe-t-il une version imprimée ?",
    answer:
      "Non, le guide est actuellement disponible uniquement au format numérique (PDF).",
  },
];

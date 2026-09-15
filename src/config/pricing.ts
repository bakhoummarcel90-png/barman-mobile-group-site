// ============================================================================
// FICHIER CENTRAL DE CONFIGURATION — FORMULES & TARIFS
// Le tarif exact d'un événement dépend de nombreux critères (nombre
// d'invités, durée, lieu, alcool ou non...). Conformément à la politique
// commerciale de Barman Mobile Group, aucun prix définitif n'est affiché
// publiquement : chaque formule affiche ce qu'elle inclut, le prix final
// étant communiqué sur devis.
//
// Si vous souhaitez un jour afficher un tarif indicatif "à partir de",
// renseignez le champ `priceFromFCFA` (sinon laissez `null`).
// ============================================================================

export type Formule = {
  slug: string;
  name: string;
  pitch: string;
  includes: string[];
  idealFor: string;
  priceFromFCFA: number | null;
  highlight?: boolean;
};

export const formules: Formule[] = [
  {
    slug: "essential",
    name: "Essential",
    pitch: "L'entrée de gamme professionnelle : un bar mobile bien tenu et une équipe soignée.",
    includes: [
      "Bar mobile et installation",
      "Carte de cocktails simple, avec ou sans alcool",
      "Barman professionnel",
      "Verrerie de base",
    ],
    idealFor: "Petits comités et réceptions simples",
    priceFromFCFA: null,
  },
  {
    slug: "essential-plus",
    name: "Essential+",
    pitch: "La formule Essential enrichie d'une carte plus large et d'un service renforcé.",
    includes: [
      "Tout le contenu de la formule Essential",
      "Carte de cocktails élargie",
      "Second barman selon le nombre d'invités",
      "Verrerie premium",
    ],
    idealFor: "Anniversaires, baptêmes et réceptions familiales",
    priceFromFCFA: null,
  },
  {
    slug: "prestige",
    name: "Prestige",
    pitch: "Une prestation complète pensée pour les mariages et les réceptions soignées.",
    includes: [
      "Bar mobile habillé selon votre thème",
      "Carte de cocktails personnalisée",
      "Équipe de barmans dédiée",
      "Verrerie premium et matériel de bar complet",
    ],
    idealFor: "Mariages et réceptions premium",
    priceFromFCFA: null,
    highlight: true,
  },
  {
    slug: "signature",
    name: "Signature",
    pitch: "Notre formule intégrée : bar mobile, catering et personnel dans une même prestation.",
    includes: [
      "Tout le contenu de la formule Prestige",
      "Option catering ou Open Grill combinée",
      "Personnel événementiel renforcé",
      "Coordination dédiée le jour de l'événement",
    ],
    idealFor: "Entreprises, institutions et grands mariages",
    priceFromFCFA: null,
  },
  {
    slug: "vip-sur-mesure",
    name: "VIP sur mesure",
    pitch: "Une prestation entièrement construite autour de votre événement, sans limite de format.",
    includes: [
      "Combinaison libre de tous nos pôles de service",
      "Carte et mise en scène entièrement personnalisées",
      "Équipe dimensionnée selon vos besoins",
      "Accompagnement dédié de la conception à la réalisation",
    ],
    idealFor: "Événements institutionnels, concerts et projets sur mesure",
    priceFromFCFA: null,
  },
];

export const facteursDePrix = [
  "Le nombre d'invités",
  "La durée de la prestation",
  "Le lieu de l'événement",
  "Le type de boissons souhaité",
  "La présence ou non d'alcool",
  "Les produits fournis par Barman Mobile ou par le client",
  "Le matériel demandé",
  "Le nombre de membres du personnel",
  "Les contraintes logistiques propres à votre lieu",
];

// ------------------------- Location de matériel -------------------------

export type RentalItem = {
  category: string;
  name: string;
  unit: string; // ex : "pièce", "table"
  priceFCFA: number | null;
};

export const rentalCatalog: RentalItem[] = [
  { category: "Verrerie", name: "Verre à vin", unit: "pièce", priceFCFA: null },
  { category: "Verrerie", name: "Flûte à champagne", unit: "pièce", priceFCFA: null },
  { category: "Verrerie", name: "Verre long drink", unit: "pièce", priceFCFA: null },
  { category: "Verrerie", name: "Verre à cocktail", unit: "pièce", priceFCFA: null },
  { category: "Verrerie", name: "Verre Martini", unit: "pièce", priceFCFA: null },
  { category: "Verrerie", name: "Verre Margarita", unit: "pièce", priceFCFA: null },
  { category: "Vaisselle", name: "Assiette", unit: "pièce", priceFCFA: null },
  { category: "Vaisselle", name: "Couvert (jeu complet)", unit: "jeu", priceFCFA: null },
  { category: "Vaisselle", name: "Chafing dish", unit: "pièce", priceFCFA: null },
  { category: "Mobilier", name: "Table de buffet", unit: "pièce", priceFCFA: null },
  { category: "Mobilier", name: "Mange-debout", unit: "pièce", priceFCFA: null },
  { category: "Mobilier", name: "Table", unit: "pièce", priceFCFA: null },
  { category: "Mobilier", name: "Chaise", unit: "pièce", priceFCFA: null },
  { category: "Habillage", name: "Nappe", unit: "pièce", priceFCFA: null },
  { category: "Habillage", name: "Housse de chaise", unit: "pièce", priceFCFA: null },
  { category: "Structures", name: "Tente de réception", unit: "pièce", priceFCFA: null },
  { category: "Bar", name: "Bar mobile", unit: "unité", priceFCFA: null },
];

export const rentalCategories = Array.from(
  new Set(rentalCatalog.map((item) => item.category))
);

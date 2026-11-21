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

// ------------------------------ Nos bars ------------------------------
// Chaque formule part avec un bar standard (champ barStandard).
// Si l'événement compte plus d'invités, on ajoute des bars selon le tableau
// barsParInvites, pour garder l'espace nécessaire à un service fluide.

export type TypeBar = "grand" | "moyen";

export const modelesBars: Record<TypeBar, { nom: string; pluriel: string; plateau: string; hauteur: string; style: string; photos: { couleur: string; src: string }[]; photoDouble: string; comptoirDouble: string; description: string }> = {
  grand: {
    nom: "Grand bar",
    pluriel: "grands bars",
    plateau: "1,97 m × 56 cm",
    hauteur: "1,11 m",
    style: "Façade à grand panneau mouluré",
    photos: [
      { couleur: "Noir", src: "/images/bars/grand-bar-noir.webp" },
      { couleur: "Blanc", src: "/images/bars/grand-bar-blanc.webp" },
    ],
    photoDouble: "/images/bars/grand-bar-noir-x2.webp",
    comptoirDouble: "3,94 m",
    description:
      "Un plateau de près de 2 mètres et 56 cm de profondeur pour préparer les cocktails, aligner la verrerie et servir plusieurs invités à la fois. Il s'assemble côte à côte pour créer un long comptoir.",
  },
  moyen: {
    nom: "Bar moyen",
    pluriel: "bars moyens",
    plateau: "1,80 m × 43 cm",
    hauteur: "1,14 m",
    style: "Façade classique à trois panneaux moulurés",
    photos: [
      { couleur: "Noir", src: "/images/bars/bar-moyen-noir.webp" },
      { couleur: "Blanc", src: "/images/bars/bar-moyen-blanc.webp" },
    ],
    photoDouble: "/images/bars/bar-moyen-noir-x2.webp",
    comptoirDouble: "3,60 m",
    description:
      "Plus compact, il s'installe facilement sur une terrasse, dans un salon ou un jardin, tout en offrant un plateau de 1,80 m pour un service complet.",
  },
};

// Photo et légende des bars inclus dans une formule (type, nombre et couleur).
export function visuelBars(f: Formule): { src: string; legende: string; titre: string } {
  const prefixe = f.barStandard === "grand" ? "grand-bar" : "bar-moyen";
  const m = modelesBars[f.barStandard];
  const src = `/images/bars/${prefixe}-${f.couleurBars}${f.barQuantite === 2 ? "-x2" : ""}.webp`;
  if (f.barQuantite === 1) {
    return { src, titre: "Bar inclus", legende: `${m.nom} ${f.couleurBars} · plateau ${m.plateau}` };
  }
  const couleur = f.couleurBars === "mixte" ? "noir et blanc" : `${f.couleurBars}s`;
  return { src, titre: "Bars inclus", legende: `2 ${m.pluriel} ${couleur} alignés · comptoir de ${m.comptoirDouble}` };
}

export const barsParInvites: { invites: string; bars: { type: TypeBar; quantite: number }[]; comptoir: string }[] = [
  { invites: "Jusqu'à 80 invités", bars: [{ type: "moyen", quantite: 1 }], comptoir: "1,80 m" },
  { invites: "81 à 150 invités", bars: [{ type: "grand", quantite: 1 }], comptoir: "1,97 m" },
  { invites: "151 à 250 invités", bars: [{ type: "grand", quantite: 1 }, { type: "moyen", quantite: 1 }], comptoir: "3,77 m" },
  { invites: "251 à 400 invités", bars: [{ type: "grand", quantite: 2 }], comptoir: "3,94 m" },
  { invites: "401 à 600 invités", bars: [{ type: "grand", quantite: 3 }], comptoir: "5,91 m" },
  { invites: "Plus de 600 invités", bars: [], comptoir: "Sur mesure" },
];

export const personnalisationBars =
  "Habillage des bars à la couleur de votre choix, pour s'accorder à votre décoration";

export const optionBarSupplementaire =
  "Bar supplémentaire en option, sur devis, si vous souhaitez un service encore plus rapide";

export type Formule = {
  slug: string;
  name: string;
  pitch: string;
  barStandard: TypeBar;
  barQuantite: 1 | 2;
  couleurBars: "noir" | "blanc" | "mixte";
  includes: string[];
  idealFor: string;
  priceFromFCFA: number | null;
  highlight?: boolean;
};

export const formules: Formule[] = [
  {
    slug: "essential",
    name: "Essential — Open Bar sans alcool",
    pitch: "Une formule élégante et accessible pour offrir à vos invités une expérience rafraîchissante entièrement sans alcool.",
    barStandard: "moyen",
    barQuantite: 1,
    couleurBars: "blanc",
    includes: [
      "Open bar sans alcool pendant 5 heures",
      "Sélection de mocktails",
      "Jus, sodas et eaux",
      "Fruits, sirops et garnitures",
      "Glaçons et consommables",
      "Verrerie standard",
      "Barmans professionnels (nombre selon le nombre d'invités)",
      "Installation, service, rangement et démontage",
      "Pause café : une tasse par invité (café classique ou café Touba, sucre et lait)",
    ],
    idealFor: "Événements sans alcool — 5 heures de service",
    priceFromFCFA: null,
  },
  {
    slug: "essential-plus",
    name: "Essential+",
    pitch: "La formule Essential enrichie d'une carte plus large et d'un service renforcé.",
    barStandard: "moyen",
    barQuantite: 2,
    couleurBars: "noir",
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
    name: "Prestige — Open Bar Cocktails & Mocktails",
    pitch: "Une expérience premium combinant cocktails, mocktails, présentation élégante et service professionnel pour rendre votre événement véritablement mémorable.",
    barStandard: "grand",
    barQuantite: 2,
    couleurBars: "blanc",
    includes: [
      "Open bar cocktails et mocktails pendant 4 heures",
      "Carte de cocktails et mocktails signature",
      "Spiritueux et boissons nécessaires à la réalisation de la carte",
      "Jus, sodas, sirops, fruits et garnitures",
      "Glaçons et consommables",
      "Verrerie premium",
      "Barmans professionnels (nombre selon le nombre d'invités)",
      "Installation, service, rangement et démontage",
      "Pause café signature : une tasse par invité (café classique ou café Touba, sucre et lait)",
    ],
    idealFor: "Mariages et réceptions premium — 4 heures de service",
    priceFromFCFA: null,
    highlight: true,
  },
  {
    slug: "signature",
    name: "Signature",
    pitch: "Notre formule intégrée : bar mobile, catering et personnel dans une même prestation.",
    barStandard: "grand",
    barQuantite: 2,
    couleurBars: "noir",
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
    barStandard: "grand",
    barQuantite: 2,
    couleurBars: "mixte",
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
  { category: "Verrerie", name: "Verre à vin", unit: "pièce", priceFCFA: 200 },
  { category: "Verrerie", name: "Flûte à champagne", unit: "pièce", priceFCFA: 200 },
  { category: "Verrerie", name: "Verre long drink", unit: "pièce", priceFCFA: 150 },
  { category: "Verrerie", name: "Coupe à cocktail", unit: "pièce", priceFCFA: 250 },
  { category: "Verrerie", name: "Verre Martini", unit: "pièce", priceFCFA: 250 },
  { category: "Verrerie", name: "Verre Margarita", unit: "pièce", priceFCFA: 250 },
  { category: "Vaisselle", name: "Assiette", unit: "pièce", priceFCFA: null },
  { category: "Vaisselle", name: "Couvert (jeu complet)", unit: "jeu", priceFCFA: null },
  { category: "Vaisselle", name: "Chafing dish", unit: "pièce", priceFCFA: null },
  { category: "Mobilier", name: "Table de buffet", unit: "pièce", priceFCFA: null },
  { category: "Mobilier", name: "Mange-debout avec housse blanche", unit: "pièce — minimum 5 unités", priceFCFA: 3000 },
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

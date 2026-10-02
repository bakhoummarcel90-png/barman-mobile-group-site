// ============================================================================
// FICHIER CENTRAL DE CONFIGURATION — CATALOGUE DÉCORATION
// Pour ajouter un article : ajoutez une entrée ci-dessous et déposez sa
// photo dans /public/images/decoration/.
// ============================================================================

export type DecorationItem = {
  slug: string;
  name: string;
  variant?: string;
  image: string;
  availability: string;
  /** Nombre maximum de pièces (ou de sets) qu'un client peut réserver */
  maxQuantity: number;
  /** Cadrage de la photo dans la carte (ex. "center 30%"), facultatif */
  imagePosition?: string;
  priceFCFA: number;
  unit: string;
};

export const decorationItems: DecorationItem[] = [
  {
    slug: "arche-ronde",
    name: "Arche ronde",
    image: "/images/decoration/arche-ronde.jpg",
    availability: "20 pièces disponibles",
    maxQuantity: 20,
    priceFCFA: 15000,
    unit: "jour",
  },
  {
    slug: "arche-geometrique",
    name: "Arche géométrique",
    variant: "Asymétrique",
    image: "/images/decoration/arche-geometrique.jpg",
    availability: "20 pièces disponibles",
    maxQuantity: 20,
    priceFCFA: 20000,
    unit: "jour",
  },
  {
    slug: "arche-coeur",
    name: "Arche cœur",
    variant: "2 m",
    image: "/images/decoration/arche-coeur.jpg",
    availability: "20 pièces disponibles",
    maxQuantity: 20,
    priceFCFA: 15000,
    unit: "jour",
  },
  {
    slug: "arche-carree",
    name: "Arche carrée / rectangulaire",
    image: "/images/decoration/arche-carree.jpg",
    availability: "20 pièces disponibles",
    maxQuantity: 20,
    priceFCFA: 15000,
    unit: "jour",
  },
  {
    slug: "support-fleurs",
    name: "Support fleurs rectangulaire",
    variant: "3 hauteurs — même modèle",
    image: "/images/decoration/support-fleurs.jpg",
    availability: "20 pièces disponibles",
    maxQuantity: 20,
    priceFCFA: 10000,
    unit: "jour (pièce)",
  },
  {
    slug: "socles-blancs",
    name: "Set de 5 socles",
    variant: "Ronds, différentes hauteurs",
    image: "/images/decoration/socles-blancs.jpg",
    availability: "20 sets disponibles",
    maxQuantity: 20,
    imagePosition: "center 25%",
    priceFCFA: 20000,
    unit: "jour",
  },
  {
    slug: "panneau-bienvenue",
    name: "Support de panneau de bienvenue",
    variant: "Doré",
    image: "/images/decoration/panneau-bienvenue.jpg",
    availability: "20 pièces disponibles",
    maxQuantity: 20,
    priceFCFA: 7500,
    unit: "jour",
  },
];

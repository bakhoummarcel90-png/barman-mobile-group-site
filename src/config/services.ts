// ============================================================================
// FICHIER CENTRAL DE CONFIGURATION — PÔLES DE SERVICES
// Chaque pôle alimente sa carte sur la page d'accueil, sa page dédiée
// et le menu de navigation. Modifiez librement les textes et listes.
// ============================================================================

export type Service = {
  slug: string;
  shortName: string;
  fullName: string;
  tagline: string;
  intro: string;
  bullets: string[];
  forWho: string;
  heroPlaceholder: string; // description de la photo à insérer
  heroImage?: string;
};

export const services: Service[] = [
  {
    slug: "bar-mobile",
    shortName: "Bar Mobile & Open Bar",
    fullName: "Barman Mobile Events — Bar mobile et Open Bar",
    tagline: "Le cœur de notre métier depuis 2019",
    intro:
      "Un bar mobile professionnel, une équipe de barmans formés et une carte de cocktails pensée pour votre événement : c'est le service qui a fondé Barman Mobile Group, et celui que nous maîtrisons le mieux.",
    bullets: [
      "Bars mobiles professionnels installés sur votre lieu de réception",
      "Cocktails classiques et créations personnalisées, avec ou sans alcool",
      "Mocktails, long drinks, apéritifs et boissons fraîches",
      "Service de vins, champagnes et spiritueux selon la formule choisie",
      "Élaboration d'une carte de cocktails sur mesure pour votre événement",
      "Verrerie, matériel de bar, ingrédients et consommables selon devis",
      "Installation, service pendant l'événement et rangement complet",
      "Barmans professionnels et gestion complète des stocks",
    ],
    forWho:
      "Mariages, anniversaires, réceptions d'entreprise, concerts et soirées privées.",
    heroPlaceholder: "Photo d'un bar mobile élégant, éclairé, lors d'une réception le soir",
    heroImage: "/images/hero-barman-mobile.webp",
  },
  {
    slug: "catering",
    shortName: "Catering",
    fullName: "BMG Catering",
    tagline: "Une restauration événementielle qui s'accorde à votre bar",
    intro:
      "BMG Catering complète naturellement notre offre de bar mobile avec une restauration événementielle professionnelle, pensée pour s'adapter à la taille et au style de votre réception.",
    bullets: [
      "Buffets pour réceptions privées ou professionnelles",
      "Cocktails dînatoires",
      "Service de restauration assuré par du personnel qualifié",
      "Formules combinées avec le bar mobile et l'open bar",
      "Adaptation du format selon le nombre d'invités et le lieu",
    ],
    forWho: "Mariages, événements d'entreprise, réceptions privées.",
    heroPlaceholder: "Photo d'un buffet dressé avec élégance lors d'une réception",
    heroImage: "/images/catering-cocktails.webp",
  },
  {
    slug: "open-grill",
    shortName: "Open Grill",
    fullName: "BMG Open Grill",
    tagline: "Une expérience culinaire spectaculaire, préparée devant vos invités",
    intro:
      "Grillades et show cooking en direct : BMG Open Grill transforme un moment de restauration en véritable animation, avec une rôtisserie mobile et une présentation pensée pour surprendre vos invités.",
    bullets: [
      "Grillades préparées sur place par notre équipe",
      "Rôtisserie mobile et show cooking",
      "Présentation attractive et vivante devant les invités",
      "Adaptation aux grands événements, de 150 à 500 personnes environ",
      "Possibilité de combiner Open Grill, Catering et Open Bar en une seule prestation",
    ],
    forWho: "Grands événements privés, professionnels et institutionnels.",
    heroPlaceholder: "Équipe Barman Mobile Group lors d'une prestation événementielle en extérieur",
  },
  {
    slug: "location-materiel",
    shortName: "Location de matériel",
    fullName: "BMG Event Rental",
    tagline: "Tout le matériel de votre réception, en un seul interlocuteur",
    intro:
      "Verrerie premium, mobilier de réception, tentes et matériel de bar : BMG Event Rental met à votre disposition l'équipement nécessaire à votre événement, avec ou sans le reste de nos prestations.",
    bullets: [
      "Verres à vin, flûtes à champagne, verres long drink, cocktail et Martini",
      "Assiettes, couverts et chafing dishes",
      "Tables de buffet et mange-debout",
      "Nappes, housses, tables et chaises",
      "Tentes et bars mobiles",
      "Matériel de service complémentaire",
    ],
    forWho:
      "Particuliers organisant une réception, hôtels, restaurants, villas et agences événementielles.",
    heroPlaceholder: "Photo d'un catalogue de verrerie et de matériel de réception dressé",
    heroImage: "/images/bar-display.webp",
  },
  {
    slug: "staffing",
    shortName: "Staffing",
    fullName: "BMG Staffing",
    tagline: "Le personnel qualifié qui fait la différence",
    intro:
      "Barmans, serveurs, maîtres d'hôtel ou coordinateurs : BMG Staffing met à votre disposition une équipe encadrée, ponctuelle et soignée dans sa présentation, pour renforcer votre propre organisation ou prendre en charge l'ensemble du service.",
    bullets: [
      "Barmans professionnels",
      "Serveurs et serveuses",
      "Maîtres d'hôtel",
      "Personnel de cuisine et de mise en place",
      "Coordinateurs d'événement",
      "Renforts ponctuels ou équipe complète selon vos besoins",
    ],
    forWho: "Entreprises, institutions, agences événementielles, hôtels et particuliers.",
    heroPlaceholder: "Photo d'une équipe en uniforme, en service, souriante et professionnelle",
    heroImage: "/images/team-barmen.webp",
  },
  {
    slug: "experiences",
    shortName: "Expériences",
    fullName: "BMG Experiences",
    tagline: "Des animations qui marquent vos invités",
    intro:
      "Au-delà du service, BMG Experiences propose des animations originales autour de la mixologie et de l'univers du bar, pensées sur mesure selon votre événement.",
    bullets: [
      "Ateliers cocktails et initiations à la mixologie",
      "Animations pour entreprises et team building",
      "Bars thématiques",
      "Création d'expériences sur mesure selon votre demande",
    ],
    forWho: "Entreprises, mariages et événements privés en recherche d'une animation originale.",
    heroPlaceholder: "Photo d'un atelier cocktails avec des invités participant activement",
    heroImage: "/images/cocktail-blue.webp",
  },
];

export const methodeDeTravail = [
  {
    title: "Vous nous présentez votre événement",
    description:
      "Un premier échange pour comprendre votre date, votre lieu, le nombre d'invités et vos envies.",
  },
  {
    title: "Nous construisons une proposition personnalisée",
    description:
      "Nous vous adressons une formule adaptée à votre budget et à vos besoins, sans surprise.",
  },
  {
    title: "Nous préparons matériel, produits et équipe",
    description:
      "Sélection des produits, préparation du matériel et briefing complet de l'équipe dédiée.",
  },
  {
    title: "Nous installons, servons et rangeons",
    description:
      "Le jour J, nous prenons tout en charge : installation, service pendant l'événement et rangement après.",
  },
];

export const pourquoiNousChoisir = [
  "Un interlocuteur unique pour l'ensemble de votre prestation",
  "Des prestations personnalisées selon votre événement et votre budget",
  "Une équipe professionnelle, ponctuelle et bien présentée",
  "Du matériel élégant et adapté à chaque type de réception",
  "Une prise en charge complète, de la préparation au rangement",
  "Une expérience acquise depuis 2019 sur le terrain sénégalais",
  "Une capacité à gérer aussi bien les petits comités que les grands événements",
  "Des solutions avec ou sans alcool, adaptées à toutes les sensibilités",
  "Des standards professionnels et internationaux, formés notamment à l'European Bartender School de Paris",
];

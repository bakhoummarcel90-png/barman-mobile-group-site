// ============================================================================
// FICHIER CENTRAL DE CONFIGURATION — COORDONNÉES & IDENTITÉ
// Modifiez uniquement les valeurs ci-dessous : elles sont utilisées
// automatiquement dans tout le site (en-tête, pied de page, page contact,
// bouton WhatsApp, mentions légales, données structurées SEO...).
// ============================================================================

export const siteConfig = {
  name: "Barman Mobile Group",
  shortName: "BMG",
  legalName: "BAKHOUM MARCEL GUIRANE",
  commercialName: "BARMAN MOBILE",
  legalForm: "Entreprise individuelle",
  ninea: "007493042",
  rccm: "SN.DKR.2019.A.23120",
  // Adresse d'immatriculation officielle (avis NINEA / RCCM) — utilisée
  // uniquement dans les mentions légales. Différente de l'adresse
  // opérationnelle ci-dessous (contact.address), où le public vous joint.
  legalAddress: "Keur Massar, Parcelles Assainies, Rufisque, Unité 4, Villa n°796, Sénégal",
  slogan: "La fête ne commence pas sans nous",
  foundingYear: 2019,
  founder: "Marcel Bakhoum",

  // Domaine du site — à confirmer avant mise en ligne (nom de domaine
  // réservé ?). Sert au SEO (canonical, Open Graph) : sans impact si
  // temporairement incorrect, mais à corriger avant le lancement définitif.
  url: "https://barmanmobile.com",

  description:
    "Barman Mobile Group organise vos bars mobiles, cocktails, catering, open grill, location de matériel et personnel événementiel à Dakar et partout au Sénégal.",

  contact: {
    phonePrincipal: "+221 77 171 46 62",
    whatsapp1: "+221 76 189 30 48",
    whatsapp2: "+221 77 256 24 48",
    email: "bakhoummarcel90@gmail.com",
    address: "Mamelles, Dakar, Sénégal",
    city: "Dakar",
    country: "Sénégal",
  },

  // Numéro utilisé par défaut pour le bouton WhatsApp flottant et le formulaire de devis
  whatsappPreferredNumber: "+221 76 189 30 48",

  social: {
    instagram: "https://www.instagram.com/barman_mobile/", // À CONFIRMER : compte non vérifié par vos soins pour l'instant
    facebook: "https://facebook.com/barmanmobile", // À COMPLÉTER si différent
    tiktok: "https://www.tiktok.com/@barmanmobile01",
  },

  // Chiffres clés — à mettre à jour librement, ils alimentent les compteurs animés
  stats: [
    { value: 2019, suffix: "", label: "Année de création" },
    { value: 150, suffix: "+", label: "Prestations réalisées" },
    { value: 100, suffix: "+", label: "Mariages accompagnés" },
    { value: 15000, suffix: "+", label: "Invités servis" },
    { value: 500, suffix: "", label: "Invités pris en charge en une prestation" },
  ],

  references: [
    "Concert de Dadju",
    "Monument de la Renaissance Africaine",
    "AFI Saly",
    "Philip Morris",
    "Société Générale",
    "Banque Islamique du Sénégal",
  ],
} as const;

export type SiteConfig = typeof siteConfig;

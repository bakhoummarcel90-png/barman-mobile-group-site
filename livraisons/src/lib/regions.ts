/**
 * Configuration par pays.
 *
 * Chaque entreprise de livraison est rattachée à un pays (choisi à
 * l'installation) : devise, fuseau horaire, indicatif téléphonique, moyens de
 * paiement et quartiers suggérés en découlent.
 *
 * Pour ajouter un pays : ajoutez une entrée dans COUNTRIES. Les moyens de
 * paiement sont des codes stables stockés en base ; aucun n'est connecté à une
 * API (saisie et confirmation manuelles). Vérifiez la liste des opérateurs
 * avec vos partenaires locaux : l'offre de mobile money évolue souvent.
 *
 * Les montants sont enregistrés en unités entières de la devise (FCFA, francs
 * guinéens, cedis, nairas, dalasis), sans centimes.
 */

export type PaymentMethodCode = string;

export interface PaymentMethodConfig {
  code: PaymentMethodCode;
  label: string;
  /** Mobile money = paiement par téléphone, à rapprocher avec le relevé de l'opérateur. */
  kind: "cash" | "mobile_money" | "bank";
}

export interface CountryConfig {
  code: string;
  name: string;
  /** Ville principale (liens d'itinéraire, suggestions). */
  city: string;
  currency: string;
  /** Libellé affiché après les montants (ex. « FCFA »). */
  currencyLabel: string;
  /** Nombre de décimales affichées (les montants sont saisis en unités entières). */
  currencyDecimals: number;
  locale: string;
  timezone: string;
  /** Indicatif téléphonique sans « + ». */
  dialCode: string;
  /** Longueur du numéro national (sans indicatif). */
  nationalNumberLength: number;
  /** Exemple de numéro affiché dans les formulaires. */
  phoneExample: string;
  paymentMethods: PaymentMethodConfig[];
  /** Quartiers proposés en suggestion dans les formulaires (saisie libre possible). */
  neighborhoods: string[];
}

const CASH: PaymentMethodConfig = { code: "cash", label: "Espèces", kind: "cash" };
const WAVE: PaymentMethodConfig = { code: "wave", label: "Wave", kind: "mobile_money" };
const ORANGE: PaymentMethodConfig = { code: "orange_money", label: "Orange Money", kind: "mobile_money" };
const MTN: PaymentMethodConfig = { code: "mtn_momo", label: "MTN Mobile Money", kind: "mobile_money" };
const MOOV: PaymentMethodConfig = { code: "moov_money", label: "Moov Money", kind: "mobile_money" };
const FREE: PaymentMethodConfig = { code: "free_money", label: "Free Money", kind: "mobile_money" };
const AIRTEL: PaymentMethodConfig = { code: "airtel_money", label: "Airtel Money", kind: "mobile_money" };
const BANK: PaymentMethodConfig = { code: "bank_transfer", label: "Virement bancaire", kind: "bank" };

const xof = { currency: "XOF", currencyLabel: "FCFA", currencyDecimals: 0 };

export const COUNTRIES: Record<string, CountryConfig> = {
  SN: {
    code: "SN", name: "Sénégal", city: "Dakar", ...xof, locale: "fr-SN", timezone: "Africa/Dakar",
    dialCode: "221", nationalNumberLength: 9, phoneExample: "77 123 45 67",
    paymentMethods: [CASH, WAVE, ORANGE, FREE],
    neighborhoods: [
      "Almadies", "Ngor", "Ouakam", "Mermoz", "Sacré-Cœur", "Point E", "Fann", "Plateau", "Médina", "Fass",
      "Colobane", "Grand Dakar", "HLM", "Liberté 6", "Sicap Baobab", "Dieuppeul", "Grand Yoff",
      "Parcelles Assainies", "Yoff", "Ouest Foire", "Cité Keur Gorgui", "Sacré-Cœur 3", "Hann Maristes",
      "Pikine", "Guédiawaye", "Thiaroye", "Keur Massar", "Rufisque", "Diamniadio", "Mbao",
    ],
  },
  CI: {
    code: "CI", name: "Côte d'Ivoire", city: "Abidjan", ...xof, locale: "fr-CI", timezone: "Africa/Abidjan",
    dialCode: "225", nationalNumberLength: 10, phoneExample: "07 12 34 56 78",
    paymentMethods: [CASH, WAVE, ORANGE, MTN, MOOV],
    neighborhoods: ["Cocody", "Riviera", "Angré", "Deux Plateaux", "Plateau", "Marcory", "Zone 4", "Treichville", "Koumassi", "Port-Bouët", "Yopougon", "Abobo", "Adjamé", "Bingerville", "Bassam"],
  },
  ML: {
    code: "ML", name: "Mali", city: "Bamako", ...xof, locale: "fr-ML", timezone: "Africa/Bamako",
    dialCode: "223", nationalNumberLength: 8, phoneExample: "76 12 34 56",
    paymentMethods: [CASH, ORANGE, MOOV, WAVE],
    neighborhoods: ["ACI 2000", "Hamdallaye", "Badalabougou", "Kalaban Coura", "Lafiabougou", "Hippodrome", "Baco Djicoroni", "Magnambougou", "Sotuba", "Faladié", "Kati"],
  },
  BF: {
    code: "BF", name: "Burkina Faso", city: "Ouagadougou", ...xof, locale: "fr-BF", timezone: "Africa/Ouagadougou",
    dialCode: "226", nationalNumberLength: 8, phoneExample: "70 12 34 56",
    paymentMethods: [CASH, ORANGE, MOOV, WAVE],
    neighborhoods: ["Ouaga 2000", "Gounghin", "Dapoya", "Patte d'Oie", "Zone du Bois", "Koulouba", "Pissy", "Tampouy", "Wemtenga", "Cissin"],
  },
  BJ: {
    code: "BJ", name: "Bénin", city: "Cotonou", ...xof, locale: "fr-BJ", timezone: "Africa/Porto-Novo",
    dialCode: "229", nationalNumberLength: 10, phoneExample: "01 97 12 34 56",
    paymentMethods: [CASH, MTN, MOOV],
    neighborhoods: ["Cadjèhoun", "Akpakpa", "Fidjrossè", "Haie Vive", "Ganhi", "Gbégamey", "Agla", "Zogbo", "Calavi", "Porto-Novo"],
  },
  TG: {
    code: "TG", name: "Togo", city: "Lomé", ...xof, locale: "fr-TG", timezone: "Africa/Lome",
    dialCode: "228", nationalNumberLength: 8, phoneExample: "90 12 34 56",
    paymentMethods: [CASH, { code: "tmoney", label: "T-Money / Mixx", kind: "mobile_money" }, { code: "flooz", label: "Flooz (Moov)", kind: "mobile_money" }],
    neighborhoods: ["Bè", "Tokoin", "Adidogomé", "Agoè", "Nyékonakpoè", "Kodjoviakopé", "Hédzranawoé", "Baguida", "Avédji"],
  },
  NE: {
    code: "NE", name: "Niger", city: "Niamey", ...xof, locale: "fr-NE", timezone: "Africa/Niamey",
    dialCode: "227", nationalNumberLength: 8, phoneExample: "90 12 34 56",
    paymentMethods: [CASH, AIRTEL, MOOV],
    neighborhoods: ["Plateau", "Yantala", "Koira Kano", "Lazaret", "Terminus", "Kouara Kano", "Gamkallé", "Talladjé"],
  },
  GN: {
    code: "GN", name: "Guinée", city: "Conakry", currency: "GNF", currencyLabel: "GNF", currencyDecimals: 0,
    locale: "fr-GN", timezone: "Africa/Conakry", dialCode: "224", nationalNumberLength: 9, phoneExample: "622 12 34 56",
    paymentMethods: [CASH, ORANGE, MTN],
    neighborhoods: ["Kaloum", "Ratoma", "Matam", "Dixinn", "Matoto", "Kipé", "Lambanyi", "Nongo", "Taouyah"],
  },
  GH: {
    code: "GH", name: "Ghana", city: "Accra", currency: "GHS", currencyLabel: "GH₵", currencyDecimals: 0,
    locale: "fr-GH", timezone: "Africa/Accra", dialCode: "233", nationalNumberLength: 9, phoneExample: "24 123 4567",
    paymentMethods: [CASH, MTN, { code: "telecel_cash", label: "Telecel Cash", kind: "mobile_money" }, { code: "at_money", label: "AT Money", kind: "mobile_money" }],
    neighborhoods: ["Osu", "East Legon", "Airport Residential", "Cantonments", "Madina", "Tema", "Spintex", "Adabraka", "Dansoman"],
  },
  NG: {
    code: "NG", name: "Nigeria", city: "Lagos", currency: "NGN", currencyLabel: "₦", currencyDecimals: 0,
    locale: "fr-NG", timezone: "Africa/Lagos", dialCode: "234", nationalNumberLength: 10, phoneExample: "803 123 4567",
    paymentMethods: [CASH, BANK, { code: "opay", label: "OPay", kind: "mobile_money" }, { code: "moniepoint", label: "Moniepoint", kind: "mobile_money" }],
    neighborhoods: ["Ikeja", "Lekki", "Victoria Island", "Ikoyi", "Yaba", "Surulere", "Ajah", "Gbagada", "Festac"],
  },
  GM: {
    code: "GM", name: "Gambie", city: "Banjul", currency: "GMD", currencyLabel: "GMD", currencyDecimals: 0,
    locale: "fr-GM", timezone: "Africa/Banjul", dialCode: "220", nationalNumberLength: 7, phoneExample: "712 3456",
    paymentMethods: [CASH, WAVE, { code: "afrimoney", label: "Afrimoney", kind: "mobile_money" }],
    neighborhoods: ["Serrekunda", "Bakau", "Kololi", "Brikama", "Fajara", "Kotu", "Brusubi"],
  },
};

export const DEFAULT_COUNTRY = "SN";

export function getCountry(code: string | null | undefined): CountryConfig {
  return COUNTRIES[code ?? DEFAULT_COUNTRY] ?? COUNTRIES[DEFAULT_COUNTRY];
}

export function countryOptions(): { code: string; name: string }[] {
  return Object.values(COUNTRIES).map((c) => ({ code: c.code, name: c.name }));
}

export function paymentMethodLabel(country: CountryConfig, code: string | null | undefined): string {
  if (!code) return "—";
  return country.paymentMethods.find((m) => m.code === code)?.label ?? code;
}

export function isValidPaymentMethod(country: CountryConfig, code: string): boolean {
  return country.paymentMethods.some((m) => m.code === code);
}

/* ------------------------------------------------------------------ */
/* Colis internationaux : pays d'origine / de destination, devises      */
/* ------------------------------------------------------------------ */

/** Pays proposés pour les colis internationaux (Afrique de l'Ouest + grands pays d'envoi). */
export const SHIPPING_COUNTRIES: Record<string, string> = {
  ...Object.fromEntries(Object.values(COUNTRIES).map((c) => [c.code, c.name])),
  MR: "Mauritanie",
  CV: "Cap-Vert",
  GW: "Guinée-Bissau",
  SL: "Sierra Leone",
  LR: "Liberia",
  CM: "Cameroun",
  MA: "Maroc",
  FR: "France",
  BE: "Belgique",
  ES: "Espagne",
  IT: "Italie",
  DE: "Allemagne",
  PT: "Portugal",
  NL: "Pays-Bas",
  CH: "Suisse",
  GB: "Royaume-Uni",
  US: "États-Unis",
  CA: "Canada",
  CN: "Chine",
  TR: "Turquie",
  AE: "Émirats arabes unis",
  IN: "Inde",
};

export function shippingCountryName(code: string | null | undefined): string {
  if (!code) return "—";
  return SHIPPING_COUNTRIES[code] ?? code;
}

/** Devises acceptées pour la valeur déclarée d'un colis. */
export const SHIPMENT_CURRENCIES = ["XOF", "EUR", "USD", "CNY", "GBP", "CAD", "GNF", "GHS", "NGN", "GMD", "MAD", "TRY", "AED"];

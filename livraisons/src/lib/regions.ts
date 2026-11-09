/**
 * Configuration par pays.
 *
 * Pour ajouter un pays : ajoutez une entrée dans COUNTRIES (devise, fuseau,
 * indicatif, moyens de paiement), puis créez une entreprise avec ce
 * `country_code`. Le reste de l'application lit ces valeurs via
 * `getCountry(company.country_code)`.
 *
 * Les moyens de paiement sont des codes stables stockés en base ("cash",
 * "wave", "orange_money"). Aucun n'est connecté à une API : la saisie et la
 * confirmation des encaissements sont manuelles dans cette version.
 */

export type PaymentMethodCode = string;

export interface PaymentMethodConfig {
  code: PaymentMethodCode;
  label: string;
  /** Mobile money = paiement par téléphone, à rapprocher avec le relevé de l'opérateur. */
  kind: "cash" | "mobile_money";
}

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  /** Libellé affiché après les montants (ex. « FCFA »). */
  currencyLabel: string;
  /** Nombre de décimales de la devise. Le franc CFA n'en a pas. */
  currencyDecimals: number;
  locale: string;
  timezone: string;
  /** Indicatif téléphonique sans « + ». */
  dialCode: string;
  /** Longueur du numéro national (sans indicatif). */
  nationalNumberLength: number;
  paymentMethods: PaymentMethodConfig[];
  /** Quartiers proposés en suggestion dans les formulaires (saisie libre possible). */
  neighborhoods: string[];
}

export const COUNTRIES: Record<string, CountryConfig> = {
  SN: {
    code: "SN",
    name: "Sénégal",
    currency: "XOF",
    currencyLabel: "FCFA",
    currencyDecimals: 0,
    locale: "fr-SN",
    timezone: "Africa/Dakar",
    dialCode: "221",
    nationalNumberLength: 9,
    paymentMethods: [
      { code: "cash", label: "Espèces", kind: "cash" },
      { code: "wave", label: "Wave", kind: "mobile_money" },
      { code: "orange_money", label: "Orange Money", kind: "mobile_money" },
    ],
    neighborhoods: [
      "Almadies", "Ngor", "Ouakam", "Mermoz", "Sacré-Cœur", "Point E", "Fann",
      "Plateau", "Médina", "Fass", "Colobane", "Grand Dakar", "HLM", "Liberté 6",
      "Sicap Baobab", "Dieuppeul", "Grand Yoff", "Parcelles Assainies", "Yoff",
      "Ouest Foire", "Cité Keur Gorgui", "Sacré-Cœur 3", "Hann Maristes",
      "Pikine", "Guédiawaye", "Thiaroye", "Keur Massar", "Rufisque",
      "Diamniadio", "Mbao",
    ],
  },
};

export const DEFAULT_COUNTRY = "SN";

export function getCountry(code: string | null | undefined): CountryConfig {
  return COUNTRIES[code ?? DEFAULT_COUNTRY] ?? COUNTRIES[DEFAULT_COUNTRY];
}

export function paymentMethodLabel(country: CountryConfig, code: string | null | undefined): string {
  if (!code) return "—";
  return country.paymentMethods.find((m) => m.code === code)?.label ?? code;
}

export function isValidPaymentMethod(country: CountryConfig, code: string): boolean {
  return country.paymentMethods.some((m) => m.code === code);
}

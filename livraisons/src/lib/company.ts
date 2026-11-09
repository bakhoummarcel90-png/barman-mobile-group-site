import { get } from "./db";
import { getCountry, type CountryConfig } from "./regions";
import type { Actor, Company } from "./types";

export function getCompany(companyId: number): Company {
  const c = get<Company>("SELECT * FROM companies WHERE id = ?", companyId);
  if (!c) throw new Error("Entreprise introuvable");
  return c;
}

/** Paramètres régionaux de l'entreprise de l'utilisateur (devise, fuseau, paiements). */
export function countryOf(actor: Pick<Actor, "countryCode">): CountryConfig {
  return getCountry(actor.countryCode);
}

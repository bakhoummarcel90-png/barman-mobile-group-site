import { timingSafeEqual } from "node:crypto";
import { get, run, transaction } from "./db";
import { logEvent } from "./events";
import { normalizePhone } from "./format";
import { hashPassword } from "./password";
import { DEFAULT_COUNTRY, getCountry } from "./regions";
import { isEmail, optional, PASSWORD_MIN, str, UserError, type FieldErrors } from "./validation";

/**
 * Première installation : tant qu'aucun compte n'existe, la page /installation
 * permet de créer l'entreprise et le premier administrateur.
 * Si la variable SETUP_CODE est définie (recommandé en ligne), ce code est exigé.
 */

export function needsSetup(): boolean {
  return !get("SELECT 1 FROM users LIMIT 1");
}

export function setupCodeRequired(): boolean {
  return !!process.env.SETUP_CODE;
}

function codeMatches(given: string): boolean {
  const expected = process.env.SETUP_CODE ?? "";
  if (!expected) return true;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface SetupInput {
  companyName: string;
  companyPhone: string | null;
  adminName: string;
  email: string | null;
  phone: string | null;
  password: string;
}

export function parseSetupForm(fd: FormData): { data: SetupInput | null; errors: FieldErrors } {
  const country = getCountry(DEFAULT_COUNTRY);
  const errors: FieldErrors = {};
  if (setupCodeRequired() && !codeMatches(str(fd, "setup_code"))) errors.setup_code = "Code d'installation incorrect.";
  const companyName = str(fd, "company_name");
  if (companyName.length < 2) errors.company_name = "Indiquez le nom de votre entreprise de livraison.";
  const rawCompanyPhone = str(fd, "company_phone");
  const companyPhone = rawCompanyPhone ? normalizePhone(rawCompanyPhone, country) : null;
  if (rawCompanyPhone && !companyPhone) errors.company_phone = "Numéro invalide, par ex. 33 800 00 00.";
  const adminName = str(fd, "admin_name");
  if (adminName.length < 2) errors.admin_name = "Indiquez votre nom.";
  const email = optional(fd, "email")?.toLowerCase() ?? null;
  if (email && !isEmail(email)) errors.email = "Adresse e-mail invalide.";
  const rawPhone = str(fd, "phone");
  const phone = rawPhone ? normalizePhone(rawPhone, country) : null;
  if (rawPhone && !phone) errors.phone = "Numéro invalide, par ex. 77 123 45 67.";
  if (!email && !rawPhone) errors.email = "Indiquez un e-mail ou un téléphone : il servira à vous connecter.";
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  const confirm = typeof fd.get("confirm_password") === "string" ? (fd.get("confirm_password") as string) : "";
  if (password.length < PASSWORD_MIN) errors.password = `Au moins ${PASSWORD_MIN} caractères.`;
  else if (password !== confirm) errors.confirm_password = "Les deux mots de passe ne correspondent pas.";
  if (Object.keys(errors).length) return { data: null, errors };
  return { data: { companyName, companyPhone, adminName, email, phone, password }, errors };
}

/** Crée l'entreprise et son administrateur ; renvoie l'identifiant du compte. */
export function runSetup(input: SetupInput): number {
  return transaction(() => {
    if (!needsSetup()) throw new UserError("L'application est déjà installée : connectez-vous.");
    const country = getCountry(DEFAULT_COUNTRY);
    const company = run(
      "INSERT INTO companies (name, country_code, currency, timezone, phone) VALUES (?, ?, ?, ?, ?)",
      input.companyName,
      country.code,
      country.currency,
      country.timezone,
      input.companyPhone,
    ).id;
    const userId = run(
      "INSERT INTO users (company_id, role, name, email, phone, password_hash) VALUES (?, 'admin', ?, ?, ?, ?)",
      company,
      input.adminName,
      input.email,
      input.phone,
      hashPassword(input.password),
    ).id;
    logEvent({ companyId: company, userId, subjectUserId: userId, kind: "account", message: "Installation : entreprise et administrateur créés" });
    return userId;
  });
}

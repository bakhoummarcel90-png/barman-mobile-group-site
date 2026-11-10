import { all, get, run, transaction } from "./db";
import { logEvent } from "./events";
import { normalizePhone } from "./format";
import { hashPassword } from "./password";
import { assertLoginAvailable, VEHICLES } from "./people";
import { getCountry, type CountryConfig } from "./regions";
import { revokeSessionsFor } from "./sessions";
import type { Actor, UserRow } from "./types";
import { isEmail, optional, PASSWORD_MIN, str, UserError, type FieldErrors } from "./validation";

/*
 * Inscription publique (/inscription), pour l'entreprise de livraison installée :
 *  - commerçant ou particulier : compte actif tout de suite (il peut créer
 *    commandes et colis, que l'administrateur voit) ;
 *  - livreur : compte EN ATTENTE ; il ne peut se connecter qu'après validation
 *    par l'administrateur (il manipule l'argent des clients).
 * Aucun SMS de vérification n'est envoyé (pas de fournisseur configuré) :
 * l'administrateur peut désactiver un compte suspect à tout moment.
 */

export interface SignupCompany {
  id: number;
  name: string;
  country_code: string;
  signup_open: number;
}

/** Entreprise qui reçoit les inscriptions : la première installée. */
export function signupCompany(): SignupCompany | null {
  return get<SignupCompany>("SELECT id, name, country_code, signup_open FROM companies ORDER BY id LIMIT 1") ?? null;
}

function commonFields(fd: FormData, country: CountryConfig, errors: FieldErrors) {
  const rawPhone = str(fd, "phone");
  const phone = normalizePhone(rawPhone, country);
  if (!rawPhone) errors.phone = "Le téléphone est obligatoire : il sert à vous connecter.";
  else if (!phone) errors.phone = `Numéro invalide, par ex. ${country.phoneExample}.`;
  const email = optional(fd, "email")?.toLowerCase() ?? null;
  if (email && !isEmail(email)) errors.email = "Adresse e-mail invalide.";
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  const confirm = typeof fd.get("confirm_password") === "string" ? (fd.get("confirm_password") as string) : "";
  if (password.length < PASSWORD_MIN) errors.password = `Au moins ${PASSWORD_MIN} caractères.`;
  else if (password !== confirm) errors.confirm_password = "Les deux mots de passe ne correspondent pas.";
  if (str(fd, "accept") !== "1") errors.accept = "Acceptez la politique de confidentialité pour continuer.";
  return { phone, email, password };
}

export type SignupKind = "commercant" | "particulier" | "livreur";

export interface MerchantSignup {
  kind: "commercant" | "particulier";
  shopName: string;
  contactName: string;
  phone: string;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  password: string;
}

export function parseMerchantSignup(fd: FormData, country: CountryConfig): { data: MerchantSignup | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const kind = str(fd, "kind") === "particulier" ? "particulier" : "commercant";
  const contactName = str(fd, "contact_name");
  if (contactName.length < 2) errors.contact_name = "Indiquez votre nom complet.";
  let shopName = str(fd, "shop_name");
  if (kind === "commercant" && shopName.length < 2) errors.shop_name = "Indiquez le nom de votre boutique.";
  if (kind === "particulier") shopName = contactName;
  const { phone, email, password } = commonFields(fd, country, errors);
  if (Object.keys(errors).length) return { data: null, errors };
  return {
    data: {
      kind,
      shopName,
      contactName,
      phone: phone!,
      email,
      address: optional(fd, "address"),
      neighborhood: optional(fd, "neighborhood"),
      password,
    },
    errors,
  };
}

/** Crée la fiche commerçant et son compte ; renvoie l'identifiant du compte (connexion immédiate). */
export function registerMerchant(companyId: number, input: MerchantSignup): number {
  return transaction(() => {
    assertLoginAvailable(input.email, input.phone);
    const merchantId = run(
      `INSERT INTO merchants (company_id, name, contact_name, phone, email, address, neighborhood, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      companyId,
      input.shopName,
      input.contactName,
      input.phone,
      input.email,
      input.address,
      input.neighborhood,
      input.kind === "particulier" ? "Particulier — inscrit lui-même" : "Inscrit lui-même",
    ).id;
    const userId = run(
      "INSERT INTO users (company_id, role, name, email, phone, password_hash, merchant_id) VALUES (?, 'merchant', ?, ?, ?, ?, ?)",
      companyId,
      input.contactName,
      input.email,
      input.phone,
      hashPassword(input.password),
      merchantId,
    ).id;
    logEvent({
      companyId,
      userId,
      merchantId,
      kind: "account",
      message: `${input.kind === "particulier" ? "Particulier" : "Commerçant"} ${input.shopName} inscrit via la page d'inscription`,
    });
    return userId;
  });
}

export interface CourierSignup {
  name: string;
  phone: string;
  email: string | null;
  vehicle: string | null;
  zone: string | null;
  password: string;
}

export function parseCourierSignup(fd: FormData, country: CountryConfig): { data: CourierSignup | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = str(fd, "contact_name");
  if (name.length < 2) errors.contact_name = "Indiquez votre nom complet.";
  const vehicle = optional(fd, "vehicle");
  if (vehicle && !VEHICLES.includes(vehicle)) errors.vehicle = "Choisissez un moyen de transport de la liste.";
  const { phone, email, password } = commonFields(fd, country, errors);
  if (Object.keys(errors).length) return { data: null, errors };
  return { data: { name, phone: phone!, email, vehicle, zone: optional(fd, "zone"), password }, errors };
}

/** Crée un livreur EN ATTENTE (inactif) jusqu'à la validation par l'administrateur. */
export function registerCourier(companyId: number, input: CourierSignup): number {
  return transaction(() => {
    assertLoginAvailable(input.email, input.phone);
    const id = run(
      `INSERT INTO users (company_id, role, name, email, phone, password_hash, vehicle, zone, active, pending, notes)
       VALUES (?, 'courier', ?, ?, ?, ?, ?, ?, 0, 1, ?)`,
      companyId,
      input.name,
      input.email,
      input.phone,
      hashPassword(input.password),
      input.vehicle,
      input.zone,
      "Inscrit lui-même",
    ).id;
    logEvent({ companyId, userId: id, subjectUserId: id, kind: "account", message: `Livreur ${input.name} inscrit, en attente de validation` });
    return id;
  });
}

/* ---------- Administration des inscriptions ---------- */

function requireAdmin(actor: Actor) {
  if (actor.role !== "admin") throw new UserError("Action réservée à l'administrateur.");
}

export function pendingCouriers(actor: Actor): UserRow[] {
  if (actor.role !== "admin") return [];
  return all<UserRow>("SELECT * FROM users WHERE company_id = ? AND role = 'courier' AND pending = 1 ORDER BY id", actor.companyId);
}

function pendingCourier(actor: Actor, userId: number): UserRow {
  const u = get<UserRow>("SELECT * FROM users WHERE id = ? AND company_id = ? AND role = 'courier' AND pending = 1", userId, actor.companyId);
  if (!u) throw new UserError("Inscription introuvable ou déjà traitée.");
  return u;
}

export function approveCourier(actor: Actor, userId: number): string {
  requireAdmin(actor);
  return transaction(() => {
    const u = pendingCourier(actor, userId);
    run("UPDATE users SET active = 1, pending = 0, updated_at = ? WHERE id = ?", new Date().toISOString(), userId);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: userId, kind: "account", message: `Inscription du livreur ${u.name} acceptée` });
    return u.name;
  });
}

/** Refus : le compte est anonymisé et reste inactif (aucune donnée personnelle conservée). */
export function rejectCourier(actor: Actor, userId: number): string {
  requireAdmin(actor);
  return transaction(() => {
    const u = pendingCourier(actor, userId);
    run(
      `UPDATE users SET name = 'Inscription refusée', email = NULL, phone = NULL, vehicle = NULL, zone = NULL,
         active = 0, pending = 0, updated_at = ? WHERE id = ?`,
      new Date().toISOString(),
      userId,
    );
    revokeSessionsFor(userId);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: userId, kind: "account", message: `Inscription de livreur refusée (${u.name})` });
    return u.name;
  });
}

export function setSignupOpen(actor: Actor, open: boolean): void {
  requireAdmin(actor);
  run("UPDATE companies SET signup_open = ? WHERE id = ?", open ? 1 : 0, actor.companyId);
}

export { getCountry };

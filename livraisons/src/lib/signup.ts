import { all, get, run, transaction } from "./db";
import { logEvent } from "./events";
import { notifyAdmins } from "./notifications";
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
 * Si l'envoi d'e-mails est configuré (lib/mail.ts), l'e-mail est obligatoire
 * et un code de vérification doit être saisi avant toute activation ou
 * notification de l'administrateur. Aucun SMS n'est envoyé.
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

function commonFields(fd: FormData, country: CountryConfig, errors: FieldErrors, emailRequired: boolean) {
  const rawPhone = str(fd, "phone");
  const phone = normalizePhone(rawPhone, country);
  if (!rawPhone) errors.phone = "Le téléphone est obligatoire : il sert à vous connecter.";
  else if (!phone) errors.phone = `Numéro invalide, par ex. ${country.phoneExample}.`;
  const email = optional(fd, "email")?.toLowerCase() ?? null;
  if (email && !isEmail(email)) errors.email = "Adresse e-mail invalide.";
  else if (!email && emailRequired) errors.email = "L'e-mail est obligatoire : un code de vérification vous y sera envoyé.";
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  const confirm = typeof fd.get("confirm_password") === "string" ? (fd.get("confirm_password") as string) : "";
  if (password.length < PASSWORD_MIN) errors.password = `Au moins ${PASSWORD_MIN} caractères.`;
  else if (password !== confirm) errors.confirm_password = "Les deux mots de passe ne correspondent pas.";
  if (str(fd, "accept") !== "1") errors.accept = "Acceptez la politique de confidentialité pour continuer.";
  return { phone, email, password };
}

export type SignupKind = "commercant" | "particulier" | "livreur" | "gp";

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

export function parseMerchantSignup(fd: FormData, country: CountryConfig, emailRequired = false): { data: MerchantSignup | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const kind = str(fd, "kind") === "particulier" ? "particulier" : "commercant";
  const contactName = str(fd, "contact_name");
  if (contactName.length < 2) errors.contact_name = "Indiquez votre nom complet.";
  let shopName = str(fd, "shop_name");
  if (kind === "commercant" && shopName.length < 2) errors.shop_name = "Indiquez le nom de votre boutique.";
  if (kind === "particulier") shopName = contactName;
  const { phone, email, password } = commonFields(fd, country, errors, emailRequired);
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

/**
 * Inscription restée sans code confirmé : on la libère (l'identifiant redevient
 * disponible) pour que la personne puisse recommencer.
 */
function purgeUnverified(email: string | null, phone: string | null): void {
  const stale = all<{ id: number; merchant_id: number | null }>(
    "SELECT id, merchant_id FROM users WHERE email_verified = 0 AND ((? IS NOT NULL AND email = ?) OR (? IS NOT NULL AND phone = ?))",
    email,
    email,
    phone,
    phone,
  );
  for (const u of stale) {
    run("DELETE FROM email_verifications WHERE user_id = ?", u.id);
    run("DELETE FROM sessions WHERE user_id = ?", u.id);
    run("DELETE FROM users WHERE id = ?", u.id);
    if (u.merchant_id) run("DELETE FROM merchants WHERE id = ? AND NOT EXISTS (SELECT 1 FROM users WHERE merchant_id = ?)", u.merchant_id, u.merchant_id);
  }
}

/**
 * Crée la fiche commerçant et son compte ; renvoie l'identifiant du compte.
 * verify = true : compte inactif jusqu'à la saisie du code reçu par e-mail
 * (puis completeSignup) ; sinon actif tout de suite.
 */
export function registerMerchant(companyId: number, input: MerchantSignup, verify = false): number {
  return transaction(() => {
    purgeUnverified(input.email, input.phone);
    assertLoginAvailable(input.email, input.phone);
    const merchantId = run(
      `INSERT INTO merchants (company_id, name, contact_name, phone, email, address, neighborhood, notes, review_pending, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      companyId,
      input.shopName,
      input.contactName,
      input.phone,
      input.email,
      input.address,
      input.neighborhood,
      input.kind === "particulier" ? "Particulier — inscrit lui-même" : "Inscrit lui-même",
      verify ? 0 : 1,
      verify ? 0 : 1,
    ).id;
    const userId = run(
      "INSERT INTO users (company_id, role, name, email, phone, password_hash, merchant_id, email_verified) VALUES (?, 'merchant', ?, ?, ?, ?, ?, ?)",
      companyId,
      input.contactName,
      input.email,
      input.phone,
      hashPassword(input.password),
      merchantId,
      verify ? 0 : 1,
    ).id;
    if (!verify) completeSignup(userId);
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

export function parseCourierSignup(fd: FormData, country: CountryConfig, emailRequired = false): { data: CourierSignup | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = str(fd, "contact_name");
  if (name.length < 2) errors.contact_name = "Indiquez votre nom complet.";
  const vehicle = optional(fd, "vehicle");
  if (vehicle && !VEHICLES.includes(vehicle)) errors.vehicle = "Choisissez un moyen de transport de la liste.";
  const { phone, email, password } = commonFields(fd, country, errors, emailRequired);
  if (Object.keys(errors).length) return { data: null, errors };
  return { data: { name, phone: phone!, email, vehicle, zone: optional(fd, "zone"), password }, errors };
}

export interface GpSignup {
  name: string;
  phone: string;
  email: string | null;
  /** Trajets habituels (ex. « Dakar ↔ Paris »), affichés à l'administrateur. */
  routes: string | null;
  password: string;
}

export function parseGpSignup(fd: FormData, country: CountryConfig, emailRequired = false): { data: GpSignup | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = str(fd, "contact_name");
  if (name.length < 2) errors.contact_name = "Indiquez votre nom complet (comme sur votre pièce d'identité).";
  const routes = optional(fd, "zone");
  if (routes && routes.length > 120) errors.zone = "120 caractères au maximum.";
  const { phone, email, password } = commonFields(fd, country, errors, emailRequired);
  if (Object.keys(errors).length) return { data: null, errors };
  return { data: { name, phone: phone!, email, routes, password }, errors };
}

/**
 * Crée un GP (voyageur) : comme un livreur, il attend la validation de
 * l'administrateur avant de pouvoir se connecter et publier des voyages.
 */
export function registerGp(companyId: number, input: GpSignup, verify = false): number {
  return transaction(() => {
    purgeUnverified(input.email, input.phone);
    assertLoginAvailable(input.email, input.phone);
    const id = run(
      `INSERT INTO users (company_id, role, name, email, phone, password_hash, zone, active, pending, notes, email_verified)
       VALUES (?, 'gp', ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      companyId,
      input.name,
      input.email,
      input.phone,
      hashPassword(input.password),
      input.routes,
      verify ? 0 : 1,
      "Inscrit lui-même",
      verify ? 0 : 1,
    ).id;
    if (!verify) completeSignup(id);
    return id;
  });
}

/**
 * Crée un livreur. verify = true : e-mail à confirmer d'abord ; ensuite (ou
 * tout de suite sans vérification) il passe EN ATTENTE de validation par
 * l'administrateur.
 */
export function registerCourier(companyId: number, input: CourierSignup, verify = false): number {
  return transaction(() => {
    purgeUnverified(input.email, input.phone);
    assertLoginAvailable(input.email, input.phone);
    const id = run(
      `INSERT INTO users (company_id, role, name, email, phone, password_hash, vehicle, zone, active, pending, notes, email_verified)
       VALUES (?, 'courier', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      companyId,
      input.name,
      input.email,
      input.phone,
      hashPassword(input.password),
      input.vehicle,
      input.zone,
      verify ? 0 : 1,
      "Inscrit lui-même",
      verify ? 0 : 1,
    ).id;
    if (!verify) completeSignup(id);
    return id;
  });
}

/**
 * Finalise une inscription (e-mail confirmé, ou vérification non configurée) :
 * commerçant actif et « à vérifier », livreur en attente de validation ;
 * journal et notification des administrateurs. Renvoie le rôle.
 */
export function completeSignup(userId: number): "merchant" | "courier" | "gp" {
  const u = get<{ id: number; company_id: number; role: string; name: string; merchant_id: number | null; vehicle: string | null }>(
    "SELECT id, company_id, role, name, merchant_id, vehicle FROM users WHERE id = ?",
    userId,
  );
  if (!u) throw new UserError("Inscription introuvable.");
  if (u.role === "gp") {
    run("UPDATE users SET pending = 1, email_verified = 1 WHERE id = ?", u.id);
    logEvent({ companyId: u.company_id, userId: u.id, subjectUserId: u.id, kind: "account", message: `GP ${u.name} inscrit, en attente de validation` });
    notifyAdmins(u.company_id, {
      title: "Nouveau GP à valider",
      body: `${u.name} veut publier ses voyages. Vérifiez son identité avant de l'accepter.`,
      url: "/gp#gp-a-valider",
    });
    return "gp";
  }
  if (u.role === "courier") {
    run("UPDATE users SET pending = 1, email_verified = 1 WHERE id = ?", u.id);
    logEvent({ companyId: u.company_id, userId: u.id, subjectUserId: u.id, kind: "account", message: `Livreur ${u.name} inscrit, en attente de validation` });
    notifyAdmins(u.company_id, {
      title: "Nouveau livreur à valider",
      body: `${u.name}${u.vehicle ? ` (${u.vehicle})` : ""} attend votre validation pour se connecter.`,
      url: "/livreurs#a-valider",
    });
    return "courier";
  }
  const m = get<{ name: string; notes: string | null }>("SELECT name, notes FROM merchants WHERE id = ?", u.merchant_id);
  run("UPDATE merchants SET active = 1, review_pending = 1 WHERE id = ?", u.merchant_id);
  run("UPDATE users SET email_verified = 1 WHERE id = ?", u.id);
  const particulier = !!m?.notes?.startsWith("Particulier");
  logEvent({
    companyId: u.company_id,
    userId: u.id,
    merchantId: u.merchant_id,
    kind: "account",
    message: `${particulier ? "Particulier" : "Commerçant"} ${m?.name} inscrit via la page d'inscription`,
  });
  notifyAdmins(u.company_id, {
    title: particulier ? "Nouveau particulier inscrit" : "Nouveau commerçant inscrit",
    body: `${m?.name} (${u.name}) — compte actif, à vérifier.`,
    url: "/commercants#a-verifier",
  });
  return "merchant";
}

/* ---------- Administration des inscriptions ---------- */

function requireAdmin(actor: Actor) {
  if (actor.role !== "admin") throw new UserError("Action réservée à l'administrateur.");
}

type Applicant = "courier" | "gp";
const APPLICANT_LABEL: Record<Applicant, string> = { courier: "livreur", gp: "GP" };

export function pendingCouriers(actor: Actor): UserRow[] {
  return pendingApplicants(actor, "courier");
}

/** Inscriptions de livreurs ou de GP en attente de validation. */
export function pendingApplicants(actor: Actor, role: Applicant): UserRow[] {
  if (actor.role !== "admin") return [];
  return all<UserRow>("SELECT * FROM users WHERE company_id = ? AND role = ? AND pending = 1 ORDER BY id", actor.companyId, role);
}

function pendingApplicant(actor: Actor, userId: number, role: Applicant): UserRow {
  const u = get<UserRow>("SELECT * FROM users WHERE id = ? AND company_id = ? AND role = ? AND pending = 1", userId, actor.companyId, role);
  if (!u) throw new UserError("Inscription introuvable ou déjà traitée.");
  return u;
}

export function approveCourier(actor: Actor, userId: number, role: Applicant = "courier"): string {
  requireAdmin(actor);
  return transaction(() => {
    const u = pendingApplicant(actor, userId, role);
    run("UPDATE users SET active = 1, pending = 0, updated_at = ? WHERE id = ?", new Date().toISOString(), userId);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: userId, kind: "account", message: `Inscription du ${APPLICANT_LABEL[role]} ${u.name} acceptée` });
    return u.name;
  });
}

/** Refus : le compte est anonymisé et reste inactif (aucune donnée personnelle conservée). */
export function rejectCourier(actor: Actor, userId: number, role: Applicant = "courier"): string {
  requireAdmin(actor);
  return transaction(() => {
    const u = pendingApplicant(actor, userId, role);
    run(
      `UPDATE users SET name = 'Inscription refusée', email = NULL, phone = NULL, vehicle = NULL, zone = NULL,
         active = 0, pending = 0, updated_at = ? WHERE id = ?`,
      new Date().toISOString(),
      userId,
    );
    revokeSessionsFor(userId);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: userId, kind: "account", message: `Inscription de ${APPLICANT_LABEL[role]} refusée (${u.name})` });
    return u.name;
  });
}

/** Commerçants et particuliers inscrits eux-mêmes, pas encore vérifiés. */
export function merchantsToReview(actor: Actor): { id: number; name: string; contact_name: string | null; phone: string | null; email: string | null; neighborhood: string | null; notes: string | null; created_at: string; active: number }[] {
  if (actor.role !== "admin") return [];
  return all("SELECT id, name, contact_name, phone, email, neighborhood, notes, created_at, active FROM merchants WHERE company_id = ? AND review_pending = 1 ORDER BY id", actor.companyId);
}

export function markMerchantVerified(actor: Actor, merchantId: number): string {
  requireAdmin(actor);
  const m = get<{ name: string }>("SELECT name FROM merchants WHERE id = ? AND company_id = ? AND review_pending = 1", merchantId, actor.companyId);
  if (!m) throw new UserError("Inscription introuvable ou déjà vérifiée.");
  run("UPDATE merchants SET review_pending = 0, updated_at = ? WHERE id = ?", new Date().toISOString(), merchantId);
  logEvent({ companyId: actor.companyId, userId: actor.id, merchantId, kind: "account", message: `Inscription de ${m.name} vérifiée` });
  return m.name;
}

export function setSignupOpen(actor: Actor, open: boolean): void {
  requireAdmin(actor);
  run("UPDATE companies SET signup_open = ? WHERE id = ?", open ? 1 : 0, actor.companyId);
}

export { getCountry };

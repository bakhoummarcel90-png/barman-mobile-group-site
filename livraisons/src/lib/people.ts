import { revokeSessionsFor } from "./sessions";
import { all, get, run, transaction, type SqlValue } from "./db";
import { logEvent } from "./events";
import { localInputToIso, normalizePhone, todayLocal } from "./format";
import { generatePassword, hashPassword, verifyPassword } from "./password";
import { getCountry, isValidPaymentMethod } from "./regions";
import type { Role } from "./constants";
import type { Actor, Merchant, UserRow } from "./types";
import { isEmail, optional, PASSWORD_MIN, str, UserError, type FieldErrors } from "./validation";

export const VEHICLES = ["Moto", "Vélo", "Voiture", "Tricycle", "À pied"];

function requireAdmin(actor: Actor): void {
  if (actor.role !== "admin") throw new UserError("Action réservée à l'administrateur.");
}

/* ------------------------------------------------------------------ */
/* Identifiants de connexion                                            */
/* ------------------------------------------------------------------ */

function assertLoginAvailable(email: string | null, phone: string | null, exceptUserId = 0): void {
  if (email && get("SELECT 1 FROM users WHERE email = ? AND id <> ?", email, exceptUserId))
    throw new UserError(`L'adresse e-mail ${email} est déjà utilisée par un autre compte.`);
  if (phone && get("SELECT 1 FROM users WHERE phone = ? AND id <> ?", phone, exceptUserId))
    throw new UserError("Ce numéro de téléphone est déjà utilisé par un autre compte.");
}

/** Lit le mot de passe initial : saisi (≥ 8 caractères) ou généré automatiquement. */
function initialPassword(fd: FormData, errors: FieldErrors): string {
  const pw = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  if (pw && pw.length < PASSWORD_MIN) errors.password = `Au moins ${PASSWORD_MIN} caractères (ou laissez vide pour en générer un).`;
  return pw || generatePassword();
}

/* ------------------------------------------------------------------ */
/* Livreurs                                                             */
/* ------------------------------------------------------------------ */

export interface CourierInput {
  name: string;
  phone: string;
  email: string | null;
  vehicle: string | null;
  zone: string | null;
  notes: string | null;
  password: string;
}

export function parseCourierForm(fd: FormData, actor: Actor, creating: boolean): { data: CourierInput | null; errors: FieldErrors } {
  const country = getCountry(actor.countryCode);
  const errors: FieldErrors = {};
  const name = str(fd, "name");
  if (name.length < 2) errors.name = "Indiquez le nom complet du livreur.";
  const rawPhone = str(fd, "phone");
  const phone = normalizePhone(rawPhone, country);
  if (!phone) errors.phone = rawPhone ? "Numéro invalide, par ex. 77 123 45 67." : "Le téléphone est obligatoire (il sert à se connecter).";
  const email = optional(fd, "email")?.toLowerCase() ?? null;
  if (email && !isEmail(email)) errors.email = "Adresse e-mail invalide.";
  const vehicle = optional(fd, "vehicle");
  if (vehicle && !VEHICLES.includes(vehicle)) errors.vehicle = "Choisissez un moyen de transport de la liste.";
  const password = creating ? initialPassword(fd, errors) : "";
  if (Object.keys(errors).length) return { data: null, errors };
  return { data: { name, phone: phone!, email, vehicle, zone: optional(fd, "zone"), notes: optional(fd, "notes"), password }, errors };
}

export function createCourier(actor: Actor, input: CourierInput): number {
  requireAdmin(actor);
  return transaction(() => {
    assertLoginAvailable(input.email, input.phone);
    const { id } = run(
      `INSERT INTO users (company_id, role, name, email, phone, password_hash, vehicle, zone, notes)
       VALUES (?, 'courier', ?, ?, ?, ?, ?, ?, ?)`,
      actor.companyId,
      input.name,
      input.email,
      input.phone,
      hashPassword(input.password),
      input.vehicle,
      input.zone,
      input.notes,
    );
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: id, kind: "account", message: `Livreur ${input.name} ajouté` });
    return id;
  });
}

export function updateCourier(actor: Actor, id: number, input: CourierInput): void {
  requireAdmin(actor);
  transaction(() => {
    getCourier(actor, id);
    assertLoginAvailable(input.email, input.phone, id);
    run(
      "UPDATE users SET name = ?, email = ?, phone = ?, vehicle = ?, zone = ?, notes = ?, updated_at = ? WHERE id = ?",
      input.name,
      input.email,
      input.phone,
      input.vehicle,
      input.zone,
      input.notes,
      new Date().toISOString(),
      id,
    );
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: id, kind: "account", message: "Profil modifié" });
  });
}

export function getCourier(actor: Actor, id: number): UserRow {
  const u = get<UserRow>("SELECT * FROM users WHERE id = ? AND company_id = ? AND role = 'courier'", id, actor.companyId);
  if (!u) throw new UserError("Livreur introuvable.");
  return u;
}

export interface CourierListItem extends UserRow {
  active_count: number;
  delivered_today: number;
  delivered_total: number;
  failed_total: number;
  cash_held: number;
}

export function listCouriers(actor: Actor, opts: { activeOnly?: boolean } = {}): CourierListItem[] {
  const tz = getCountry(actor.countryCode).timezone;
  const start = localInputToIso(todayLocal(tz), tz)!;
  return all<CourierListItem>(
    `SELECT u.*,
       (SELECT COUNT(*) FROM deliveries d WHERE d.courier_id = u.id AND d.status IN ('attribuee','en_cours')) AS active_count,
       (SELECT COUNT(*) FROM deliveries d WHERE d.courier_id = u.id AND d.status = 'livree' AND d.completed_at >= ?) AS delivered_today,
       (SELECT COUNT(*) FROM deliveries d WHERE d.courier_id = u.id AND d.status = 'livree') AS delivered_total,
       (SELECT COUNT(*) FROM deliveries d WHERE d.courier_id = u.id AND d.status IN ('echec','retour_commercant')) AS failed_total,
       (SELECT COALESCE(SUM(d.collected_amount),0) FROM deliveries d WHERE d.courier_id = u.id AND d.status = 'livree'
          AND d.courier_settlement_id IS NULL) AS cash_held
     FROM users u
     WHERE u.company_id = ? AND u.role = 'courier' ${opts.activeOnly ? "AND u.active = 1" : ""}
     ORDER BY u.active DESC, u.name`,
    start,
    actor.companyId,
  );
}

/** Liste courte pour les menus déroulants. */
export function courierOptions(actor: Actor): { id: number; name: string; active: number }[] {
  if (actor.role !== "admin") return [];
  return all("SELECT id, name, active FROM users WHERE company_id = ? AND role = 'courier' ORDER BY active DESC, name", actor.companyId);
}

/* ------------------------------------------------------------------ */
/* Commerçants                                                          */
/* ------------------------------------------------------------------ */

export interface MerchantInput {
  name: string;
  contactName: string;
  phone: string;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  payoutMethod: string | null;
  payoutAccount: string | null;
  notes: string | null;
  password: string;
}

export function parseMerchantForm(fd: FormData, actor: Actor, creating: boolean): { data: MerchantInput | null; errors: FieldErrors } {
  const country = getCountry(actor.countryCode);
  const errors: FieldErrors = {};
  const name = str(fd, "name");
  if (name.length < 2) errors.name = "Indiquez le nom de la boutique.";
  const contactName = str(fd, "contact_name");
  if (contactName.length < 2) errors.contact_name = "Indiquez le nom du responsable.";
  const rawPhone = str(fd, "phone");
  const phone = normalizePhone(rawPhone, country);
  if (!phone) errors.phone = rawPhone ? "Numéro invalide, par ex. 77 123 45 67." : "Le téléphone est obligatoire (il sert à se connecter).";
  const email = optional(fd, "email")?.toLowerCase() ?? null;
  if (email && !isEmail(email)) errors.email = "Adresse e-mail invalide.";
  const payoutMethod = optional(fd, "payout_method");
  if (payoutMethod && !isValidPaymentMethod(country, payoutMethod)) errors.payout_method = "Moyen de reversement invalide.";
  let payoutAccount = optional(fd, "payout_account");
  if (payoutAccount && payoutMethod && payoutMethod !== "cash") {
    const n = normalizePhone(payoutAccount, country);
    if (!n) errors.payout_account = "Numéro Wave / Orange Money invalide.";
    else payoutAccount = n;
  }
  const password = creating ? initialPassword(fd, errors) : "";
  if (Object.keys(errors).length) return { data: null, errors };
  return {
    data: {
      name,
      contactName,
      phone: phone!,
      email,
      address: optional(fd, "address"),
      neighborhood: optional(fd, "neighborhood"),
      payoutMethod,
      payoutAccount,
      notes: optional(fd, "notes"),
      password,
    },
    errors,
  };
}

/** Crée la boutique et le compte d'accès du commerçant (connexion par téléphone ou e-mail). */
export function createMerchant(actor: Actor, input: MerchantInput): number {
  requireAdmin(actor);
  return transaction(() => {
    assertLoginAvailable(input.email, input.phone);
    const { id } = run(
      `INSERT INTO merchants (company_id, name, contact_name, phone, email, address, neighborhood, payout_method, payout_account, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      actor.companyId,
      input.name,
      input.contactName,
      input.phone,
      input.email,
      input.address,
      input.neighborhood,
      input.payoutMethod,
      input.payoutAccount,
      input.notes,
    );
    run(
      `INSERT INTO users (company_id, role, name, email, phone, password_hash, merchant_id) VALUES (?, 'merchant', ?, ?, ?, ?, ?)`,
      actor.companyId,
      input.contactName,
      input.email,
      input.phone,
      hashPassword(input.password),
      id,
    );
    logEvent({ companyId: actor.companyId, userId: actor.id, merchantId: id, kind: "account", message: `Commerçant ${input.name} ajouté` });
    return id;
  });
}

export function updateMerchant(actor: Actor, id: number, input: MerchantInput): void {
  requireAdmin(actor);
  transaction(() => {
    getMerchant(actor, id);
    const account = merchantAccounts(actor, id)[0];
    assertLoginAvailable(input.email, input.phone, account?.id ?? 0);
    const now = new Date().toISOString();
    run(
      `UPDATE merchants SET name = ?, contact_name = ?, phone = ?, email = ?, address = ?, neighborhood = ?,
         payout_method = ?, payout_account = ?, notes = ?, updated_at = ? WHERE id = ?`,
      input.name,
      input.contactName,
      input.phone,
      input.email,
      input.address,
      input.neighborhood,
      input.payoutMethod,
      input.payoutAccount,
      input.notes,
      now,
      id,
    );
    // Le compte d'accès principal suit les coordonnées du responsable.
    if (account)
      run("UPDATE users SET name = ?, email = ?, phone = ?, updated_at = ? WHERE id = ?", input.contactName, input.email, input.phone, now, account.id);
    logEvent({ companyId: actor.companyId, userId: actor.id, merchantId: id, kind: "account", message: "Fiche commerçant modifiée" });
  });
}

export function getMerchant(actor: Actor, id: number): Merchant {
  if (actor.role === "merchant" && actor.merchantId !== id) throw new UserError("Commerçant introuvable.");
  const m = get<Merchant>("SELECT * FROM merchants WHERE id = ? AND company_id = ?", id, actor.companyId);
  if (!m) throw new UserError("Commerçant introuvable.");
  return m;
}

export function merchantAccounts(actor: Actor, merchantId: number): UserRow[] {
  return all<UserRow>(
    "SELECT * FROM users WHERE company_id = ? AND role = 'merchant' AND merchant_id = ? ORDER BY id",
    actor.companyId,
    merchantId,
  );
}

export interface MerchantListItem extends Merchant {
  orders_total: number;
  orders_active: number;
  delivered_total: number;
  to_pay: number;
}

export function listMerchants(actor: Actor): MerchantListItem[] {
  requireAdmin(actor);
  return all<MerchantListItem>(
    `SELECT m.*,
       (SELECT COUNT(*) FROM deliveries d WHERE d.merchant_id = m.id) AS orders_total,
       (SELECT COUNT(*) FROM deliveries d WHERE d.merchant_id = m.id AND d.status IN ('a_attribuer','attribuee','en_cours','echec')) AS orders_active,
       (SELECT COUNT(*) FROM deliveries d WHERE d.merchant_id = m.id AND d.status = 'livree') AS delivered_total,
       (SELECT COALESCE(SUM(d.collected_amount - d.delivery_fee),0) FROM deliveries d WHERE d.merchant_id = m.id
          AND d.status = 'livree' AND d.payment_status = 'confirme' AND d.merchant_settlement_id IS NULL) AS to_pay
     FROM merchants m WHERE m.company_id = ? ORDER BY m.active DESC, m.name`,
    actor.companyId,
  );
}

export function merchantOptions(actor: Actor): { id: number; name: string; active: number }[] {
  if (actor.role !== "admin") return [];
  return all("SELECT id, name, active FROM merchants WHERE company_id = ? ORDER BY active DESC, name", actor.companyId);
}

export function setMerchantActive(actor: Actor, id: number, active: boolean): void {
  requireAdmin(actor);
  transaction(() => {
    const m = getMerchant(actor, id);
    run("UPDATE merchants SET active = ?, updated_at = ? WHERE id = ?", active ? 1 : 0, new Date().toISOString(), id);
    if (!active) for (const u of merchantAccounts(actor, id)) revokeSessionsFor(u.id);
    logEvent({
      companyId: actor.companyId,
      userId: actor.id,
      merchantId: id,
      kind: "account",
      message: active ? `Commerçant ${m.name} réactivé` : `Commerçant ${m.name} désactivé (accès bloqué, plus de nouvelles commandes)`,
    });
  });
}

/* ------------------------------------------------------------------ */
/* Comptes : activation, mots de passe, administrateurs                 */
/* ------------------------------------------------------------------ */

function companyUser(actor: Actor, userId: number): UserRow {
  const u = get<UserRow>("SELECT * FROM users WHERE id = ? AND company_id = ?", userId, actor.companyId);
  if (!u) throw new UserError("Utilisateur introuvable.");
  return u;
}

export function setUserActive(actor: Actor, userId: number, active: boolean): void {
  requireAdmin(actor);
  transaction(() => {
    const u = companyUser(actor, userId);
    if (u.id === actor.id) throw new UserError("Vous ne pouvez pas désactiver votre propre compte.");
    if (!active && u.role === "courier") {
      const n = get<{ n: number }>("SELECT COUNT(*) AS n FROM deliveries WHERE courier_id = ? AND status IN ('attribuee','en_cours')", userId)!.n;
      if (n > 0) throw new UserError(`${u.name} a encore ${n} livraison(s) attribuée(s) ou en cours : réattribuez-les avant de désactiver ce compte.`);
    }
    if (!active && u.role === "admin") {
      const admins = get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE company_id = ? AND role = 'admin' AND active = 1", actor.companyId)!.n;
      if (admins <= 1) throw new UserError("Il doit rester au moins un administrateur actif.");
    }
    run("UPDATE users SET active = ?, updated_at = ? WHERE id = ?", active ? 1 : 0, new Date().toISOString(), userId);
    if (!active) revokeSessionsFor(userId);
    logEvent({
      companyId: actor.companyId,
      userId: actor.id,
      subjectUserId: userId,
      merchantId: u.merchant_id,
      kind: "account",
      message: active ? `Compte de ${u.name} réactivé` : `Compte de ${u.name} désactivé`,
    });
  });
}

/** Génère un nouveau mot de passe (affiché une seule fois à l'administrateur). */
export function resetPassword(actor: Actor, userId: number): string {
  requireAdmin(actor);
  const u = companyUser(actor, userId);
  const pw = generatePassword();
  run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", hashPassword(pw), new Date().toISOString(), userId);
  revokeSessionsFor(userId);
  logEvent({
    companyId: actor.companyId,
    userId: actor.id,
    subjectUserId: userId,
    merchantId: u.merchant_id,
    kind: "account",
    message: `Nouveau mot de passe généré pour ${u.name}`,
  });
  return pw;
}

export function changeOwnPassword(actor: Actor, current: string, next: string): void {
  const u = companyUser(actor, actor.id);
  if (!verifyPassword(current, u.password_hash)) throw new UserError("Le mot de passe actuel est incorrect.");
  if (next.length < PASSWORD_MIN) throw new UserError(`Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`);
  run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", hashPassword(next), new Date().toISOString(), actor.id);
}

export function listAdmins(actor: Actor): UserRow[] {
  requireAdmin(actor);
  return all<UserRow>("SELECT * FROM users WHERE company_id = ? AND role = 'admin' ORDER BY active DESC, name", actor.companyId);
}

export interface AdminInput {
  name: string;
  email: string | null;
  phone: string | null;
  password: string;
}

export function parseAdminForm(fd: FormData, actor: Actor): { data: AdminInput | null; errors: FieldErrors } {
  const country = getCountry(actor.countryCode);
  const errors: FieldErrors = {};
  const name = str(fd, "name");
  if (name.length < 2) errors.name = "Indiquez le nom.";
  const email = optional(fd, "email")?.toLowerCase() ?? null;
  if (email && !isEmail(email)) errors.email = "Adresse e-mail invalide.";
  const rawPhone = str(fd, "phone");
  const phone = rawPhone ? normalizePhone(rawPhone, country) : null;
  if (rawPhone && !phone) errors.phone = "Numéro invalide, par ex. 77 123 45 67.";
  if (!email && !rawPhone) errors.email = "Indiquez au moins un e-mail ou un téléphone pour la connexion.";
  const password = initialPassword(fd, errors);
  if (Object.keys(errors).length) return { data: null, errors };
  return { data: { name, email, phone, password }, errors };
}

export function createAdmin(actor: Actor, input: AdminInput): number {
  requireAdmin(actor);
  return transaction(() => {
    assertLoginAvailable(input.email, input.phone);
    const { id } = run(
      "INSERT INTO users (company_id, role, name, email, phone, password_hash) VALUES (?, 'admin', ?, ?, ?, ?)",
      actor.companyId,
      input.name,
      input.email,
      input.phone,
      hashPassword(input.password),
    );
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: id, kind: "account", message: `Administrateur ${input.name} ajouté` });
    return id;
  });
}

export function updateCompany(actor: Actor, name: string, phone: string | null): void {
  requireAdmin(actor);
  if (name.trim().length < 2) throw new UserError("Indiquez le nom de l'entreprise.");
  run("UPDATE companies SET name = ?, phone = ? WHERE id = ?", name.trim(), phone, actor.companyId);
}

/** Recherche d'un compte pour la connexion (e-mail ou téléphone). */
export function findLoginUser(identifier: string): (UserRow & { merchant_active: number | null }) | undefined {
  const id = identifier.trim().toLowerCase();
  const phone = normalizePhone(identifier, getCountry(null));
  const params: SqlValue[] = [id];
  let sql = `SELECT u.*, m.active AS merchant_active FROM users u LEFT JOIN merchants m ON m.id = u.merchant_id WHERE u.email = ?`;
  if (phone) {
    sql += " OR u.phone = ?";
    params.push(phone);
  }
  return get(sql + " LIMIT 1", ...params);
}

export type { Role };

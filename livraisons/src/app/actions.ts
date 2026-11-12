"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  clearLoginFailures,
  createSession,
  destroySession,
  loginLockedFor,
  recordLoginFailure,
  requireUser,
} from "@/lib/auth";
import { isDeliveryStatus, isPaymentStatus, isShipmentStatus } from "@/lib/constants";
import * as deliveries from "@/lib/deliveries";
import { recordCourierRemittance, recordMerchantPayout } from "@/lib/finance";
import { formatMoney, normalizePhone, parseAmount } from "@/lib/format";
import { verifyPassword } from "@/lib/password";
import * as people from "@/lib/people";
import * as shipments from "@/lib/shipments";
import { getCountry, isValidPaymentMethod } from "@/lib/regions";
import { needsSetup, parseSetupForm, runSetup } from "@/lib/setup";
import { run } from "@/lib/db";
import * as notifications from "@/lib/notifications";
import { OPTIONS, VEHICLE_TYPES } from "@/lib/pricing";
import { mailConfigured } from "@/lib/mail";
import * as signup from "@/lib/signup";
import * as verification from "@/lib/verification";
import { savePhoto } from "@/lib/storage";
import { formValues, invalid, optional, str, UserError, type FormState } from "@/lib/validation";

/** Transforme une erreur en message lisible ; les erreurs techniques sont journalisées. */
function failure(err: unknown, fd?: FormData): FormState {
  unstable_rethrow(err);
  if (err instanceof UserError) return { ok: false, message: err.message, values: fd ? formValues(fd) : undefined };
  console.error(err);
  return {
    ok: false,
    message: "Une erreur inattendue est survenue. Réessayez ; si le problème continue, contactez l'administrateur.",
    values: fd ? formValues(fd) : undefined,
  };
}

function idFrom(fd: FormData, key = "id"): number {
  const n = Number(str(fd, key));
  if (!Number.isInteger(n) || n <= 0) throw new UserError("Identifiant manquant.");
  return n;
}

function refresh() {
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ */
/* Connexion                                                            */
/* ------------------------------------------------------------------ */

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const identifier = str(fd, "identifier");
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  if (!identifier || !password)
    return { ok: false, message: "Saisissez votre e-mail ou téléphone et votre mot de passe.", values: { identifier } };
  const key = identifier.toLowerCase();
  const wait = loginLockedFor(key);
  if (wait) return { ok: false, message: `Trop de tentatives. Réessayez dans ${wait} minute(s).`, values: { identifier } };

  const user = people.findLoginUser(identifier);
  if (!user || !verifyPassword(password, user.password_hash)) {
    recordLoginFailure(key);
    return { ok: false, message: "Identifiant ou mot de passe incorrect.", values: { identifier } };
  }
  if (!user.email_verified) {
    // Inscription jamais confirmée : nouveau code et page de saisie.
    clearLoginFailures(key);
    let token: string;
    try {
      token = await verification.startVerification(user.id);
    } catch (err) {
      return failure(err, fd);
    }
    redirect(`/inscription/verifier/${token}`);
  }
  if (user.pending)
    return {
      ok: false,
      message: "Votre inscription de livreur est en attente de validation par l'entreprise de livraison. Vous pourrez vous connecter dès qu'elle sera acceptée.",
      values: { identifier },
    };
  if (!user.active || (user.role === "merchant" && !user.merchant_active))
    return { ok: false, message: "Ce compte est désactivé. Contactez l'administrateur de votre entreprise de livraison.", values: { identifier } };
  clearLoginFailures(key);
  await createSession(user.id);
  redirect(user.role === "courier" ? "/livraisons" : "/tableau-de-bord");
}

/** Première installation : entreprise + premier administrateur (uniquement si aucun compte n'existe). */
export async function setupAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!needsSetup()) redirect("/connexion");
  const parsed = parseSetupForm(fd);
  if (!parsed.data) return invalid(parsed.errors, fd);
  let userId: number;
  try {
    userId = runSetup(parsed.data);
  } catch (err) {
    return failure(err, fd);
  }
  await createSession(userId);
  redirect("/tableau-de-bord");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/connexion");
}

/* ------------------------------------------------------------------ */
/* Commandes et livraisons                                              */
/* ------------------------------------------------------------------ */

export async function saveDeliveryAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin", "merchant"]);
  const parsed = deliveries.parseDeliveryForm(fd, actor);
  if (!parsed.data) return invalid(parsed.errors, fd);
  let id: number;
  try {
    const existing = str(fd, "id");
    if (existing) {
      id = idFrom(fd);
      deliveries.updateDelivery(actor, id, parsed.data);
    } else {
      id = deliveries.createDelivery(actor, parsed.data);
    }
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  redirect(`/commandes/${id}?ok=${str(fd, "id") ? "modifiee" : "creee"}`);
}

export async function assignAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  try {
    const courier = str(fd, "courier_id");
    deliveries.assignCourier(actor, idFrom(fd), courier ? Number(courier) : null);
  } catch (err) {
    return failure(err);
  }
  refresh();
  // Depuis la page Livraisons, la commande quitte la liste « À attribuer » : bandeau de confirmation.
  if (str(fd, "from") === "livraisons") redirect("/livraisons?ok=attribuee");
  return { ok: true, message: str(fd, "courier_id") ? "Livreur attribué." : "Livreur retiré : la commande est à attribuer." };
}

export async function statusAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser();
  let id: number;
  let to: string;
  try {
    id = idFrom(fd);
    to = str(fd, "to");
    if (!isDeliveryStatus(to)) throw new UserError("Statut inconnu.");
    let collectedAmount: number | null = null;
    if (to === "livree") {
      const raw = str(fd, "collected_amount");
      collectedAmount = parseAmount(raw === "" ? "x" : raw);
      if (collectedAmount === null)
        return invalid({ collected_amount: "Indiquez le montant encaissé en chiffres (0 si rien n'a été encaissé)." }, fd, "Vérifiez le montant encaissé.");
    }
    const photo = await savePhoto(actor.companyId, fd.get("photo"));
    const signatureFile = to === "livree" ? await savePhoto(actor.companyId, fd.get("signature")) : null;
    deliveries.changeStatus(actor, id, {
      signature: signatureFile,
      to,
      note: optional(fd, "note"),
      failureReason: [optional(fd, "failure_reason"), optional(fd, "failure_detail")].filter(Boolean).join(" : ") || null,
      collectedAmount,
      collectedMethod: optional(fd, "collected_method"),
      proofPhoto: photo,
    });
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  // Le formulaire disparaît (étape suivante) : la confirmation s'affiche en bandeau sur la fiche.
  redirect(`/commandes/${id}?ok=${to}`);
}

export async function noteAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin", "courier"]);
  try {
    const photo = await savePhoto(actor.companyId, fd.get("photo"));
    deliveries.addNote(actor, idFrom(fd), optional(fd, "note"), photo);
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  return { ok: true, message: "Ajouté à l'historique de la livraison." };
}

export async function paymentAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const status = str(fd, "payment_status");
  const amount = parseAmount(str(fd, "collected_amount"));
  if (!isPaymentStatus(status)) return invalid({ payment_status: "Choisissez un statut." }, fd);
  if (amount === null) return invalid({ collected_amount: "Montant invalide (chiffres uniquement)." }, fd);
  try {
    deliveries.reviewPayment(actor, idFrom(fd), {
      status,
      collectedAmount: amount,
      method: optional(fd, "collected_method"),
      note: optional(fd, "payment_note"),
    });
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  return { ok: true, message: "Encaissement mis à jour." };
}

/** Confirmation rapide depuis la liste des encaissements à vérifier. */
export async function quickConfirmAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  try {
    const d = deliveries.getDelivery(actor, idFrom(fd));
    if (!d) throw new UserError("Livraison introuvable.");
    deliveries.reviewPayment(actor, d.id, {
      status: "confirme",
      collectedAmount: d.collected_amount ?? 0,
      method: d.collected_payment_method,
      note: d.payment_status === "ecart" ? `Écart accepté. ${d.payment_note ?? ""}`.trim() : null,
    });
  } catch (err) {
    return failure(err);
  }
  refresh();
  redirect("/encaissements?ok=confirme#a-verifier");
}

/* ------------------------------------------------------------------ */
/* Remises et reversements                                              */
/* ------------------------------------------------------------------ */

function settlementInput(fd: FormData, countryCode: string) {
  const method = optional(fd, "method");
  if (method && !isValidPaymentMethod(getCountry(countryCode), method)) throw new UserError("Moyen de paiement invalide.");
  return { method, reference: optional(fd, "reference"), note: optional(fd, "note") };
}

export async function courierRemittanceAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  try {
    recordCourierRemittance(actor, idFrom(fd), settlementInput(fd, actor.countryCode));
  } catch (err) {
    return failure(err);
  }
  refresh();
  redirect("/encaissements?ok=remise#historique");
}

export async function merchantPayoutAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  try {
    recordMerchantPayout(actor, idFrom(fd), settlementInput(fd, actor.countryCode));
  } catch (err) {
    return failure(err);
  }
  refresh();
  redirect("/encaissements?ok=reversement#historique");
}

/* ------------------------------------------------------------------ */
/* Livreurs, commerçants, comptes                                       */
/* ------------------------------------------------------------------ */

export async function saveCourierAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const existing = str(fd, "id");
  const parsed = people.parseCourierForm(fd, actor, !existing);
  if (!parsed.data) return invalid(parsed.errors, fd);
  try {
    if (existing) {
      people.updateCourier(actor, idFrom(fd), parsed.data);
      refresh();
      return { ok: true, message: "Profil du livreur enregistré." };
    }
    const id = people.createCourier(actor, parsed.data);
    refresh();
    return {
      ok: true,
      message: `${parsed.data.name} peut maintenant se connecter.`,
      data: { id, password: parsed.data.password, login: parsed.data.phone, name: parsed.data.name },
    };
  } catch (err) {
    return failure(err, fd);
  }
}

export async function saveMerchantAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const existing = str(fd, "id");
  const parsed = people.parseMerchantForm(fd, actor, !existing);
  if (!parsed.data) return invalid(parsed.errors, fd);
  try {
    if (existing) {
      people.updateMerchant(actor, idFrom(fd), parsed.data);
      refresh();
      return { ok: true, message: "Fiche commerçant enregistrée." };
    }
    const id = people.createMerchant(actor, parsed.data);
    refresh();
    return {
      ok: true,
      message: `${parsed.data.name} est ajouté. Transmettez ses identifiants à ${parsed.data.contactName}.`,
      data: { id, password: parsed.data.password, login: parsed.data.email ?? parsed.data.phone, name: parsed.data.name },
    };
  } catch (err) {
    return failure(err, fd);
  }
}

export async function toggleUserAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const active = str(fd, "active") === "1";
  try {
    people.setUserActive(actor, idFrom(fd, "user_id"), active);
  } catch (err) {
    return failure(err);
  }
  refresh();
  return { ok: true, message: active ? "Compte réactivé." : "Compte désactivé : l'accès est bloqué." };
}

export async function toggleMerchantAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const active = str(fd, "active") === "1";
  try {
    people.setMerchantActive(actor, idFrom(fd, "merchant_id"), active);
  } catch (err) {
    return failure(err);
  }
  refresh();
  return { ok: true, message: active ? "Commerçant réactivé." : "Commerçant désactivé : accès bloqué et nouvelles commandes impossibles." };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  try {
    const password = people.resetPassword(actor, idFrom(fd, "user_id"));
    return { ok: true, message: "Nouveau mot de passe généré. Les anciennes sessions sont déconnectées.", data: { password } };
  } catch (err) {
    return failure(err);
  }
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser();
  const current = String(fd.get("current_password") ?? "");
  const next = String(fd.get("new_password") ?? "");
  const confirm = String(fd.get("confirm_password") ?? "");
  if (next !== confirm) return { ok: false, errors: { confirm_password: "Les deux mots de passe ne correspondent pas." }, message: "Vérifiez la confirmation." };
  try {
    people.changeOwnPassword(actor, current, next);
  } catch (err) {
    return failure(err);
  }
  return { ok: true, message: "Mot de passe modifié." };
}

export async function deleteAccountAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser();
  if (str(fd, "confirm") !== "SUPPRIMER") return { ok: false, errors: { confirm: "Tapez SUPPRIMER en majuscules pour confirmer." }, message: "Confirmation manquante." };
  try {
    people.deleteOwnAccount(actor, String(fd.get("password") ?? ""));
  } catch (err) {
    return failure(err);
  }
  await destroySession();
  redirect("/suppression-compte?ok=1");
}

export async function createAdminAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const parsed = people.parseAdminForm(fd, actor);
  if (!parsed.data) return invalid(parsed.errors, fd);
  try {
    people.createAdmin(actor, parsed.data);
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  return {
    ok: true,
    message: `Administrateur ${parsed.data.name} ajouté.`,
    data: { password: parsed.data.password, login: parsed.data.email ?? parsed.data.phone ?? "" },
  };
}

export async function companyAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const rawPhone = str(fd, "phone");
  const phone = rawPhone ? normalizePhone(rawPhone, getCountry(actor.countryCode)) : null;
  if (rawPhone && !phone) return invalid({ phone: `Numéro invalide, par ex. ${getCountry(actor.countryCode).phoneExample}.` }, fd);
  try {
    people.updateCompany(actor, str(fd, "name"), phone);
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  return { ok: true, message: "Informations de l'entreprise enregistrées." };
}

/* ------------------------------------------------------------------ */
/* Colis internationaux                                                 */
/* ------------------------------------------------------------------ */

export async function saveShipmentAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin", "merchant"]);
  const parsed = shipments.parseShipmentForm(fd, actor);
  if (!parsed.data) return invalid(parsed.errors, fd);
  const existing = str(fd, "id");
  let id: number;
  try {
    if (existing) {
      id = idFrom(fd);
      shipments.updateShipment(actor, id, parsed.data);
    } else {
      id = shipments.createShipment(actor, parsed.data);
    }
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  redirect(`/colis/${id}?ok=${existing ? "modifie" : "cree"}`);
}

export async function shipmentStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const status = str(fd, "status");
  if (!isShipmentStatus(status)) return invalid({ status: "Choisissez une étape." }, fd);
  let id: number;
  try {
    id = idFrom(fd);
    shipments.changeShipmentStatus(actor, id, { status, location: optional(fd, "location"), note: optional(fd, "note") });
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  redirect(`/colis/${id}?ok=etape`);
}

/* ------------------------------------------------------------------ */
/* Inscription publique                                                 */
/* ------------------------------------------------------------------ */

/** Au plus 5 inscriptions par heure et par adresse IP (contre les créations en rafale). */
const signupAttempts = new Map<string, number[]>();
async function signupAllowed(): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (signupAttempts.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= 5) return false;
  recent.push(now);
  signupAttempts.set(ip, recent);
  return true;
}

export async function signupAction(_: FormState, fd: FormData): Promise<FormState> {
  const company = signup.signupCompany();
  if (!company) redirect("/installation");
  if (!company.signup_open) return { ok: false, message: "Les inscriptions sont fermées pour le moment. Contactez l'entreprise de livraison." };
  const country = signup.getCountry(company.country_code);
  const verify = mailConfigured();
  const kind = str(fd, "kind");
  const parsed = kind === "livreur" ? signup.parseCourierSignup(fd, country, verify) : signup.parseMerchantSignup(fd, country, verify);
  if (!parsed.data) return invalid(parsed.errors, fd);
  if (!(await signupAllowed())) return { ok: false, message: "Trop d'inscriptions depuis cette connexion. Réessayez dans une heure.", values: formValues(fd) };
  let userId: number;
  let token: string | null = null;
  try {
    userId =
      kind === "livreur"
        ? signup.registerCourier(company.id, parsed.data as signup.CourierSignup, verify)
        : signup.registerMerchant(company.id, parsed.data as signup.MerchantSignup, verify);
    if (verify) token = await verification.startVerification(userId);
  } catch (err) {
    return failure(err, fd);
  }
  if (token) redirect(`/inscription/verifier/${token}`);
  if (kind === "livreur") redirect("/inscription/merci");
  await createSession(userId);
  redirect("/tableau-de-bord?bienvenue=1");
}

/** Saisie du code reçu par e-mail : finalise l'inscription. */
export async function verifyCodeAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "token");
  let role: "merchant" | "courier";
  let userId: number;
  try {
    userId = verification.checkCode(token, str(fd, "code"));
    role = signup.completeSignup(userId);
  } catch (err) {
    return failure(err);
  }
  if (role === "courier") redirect("/inscription/merci?verifie=1");
  await createSession(userId);
  redirect("/tableau-de-bord?bienvenue=1");
}

export async function resendCodeAction(_: FormState, fd: FormData): Promise<FormState> {
  try {
    await verification.resendCode(str(fd, "token"));
  } catch (err) {
    return failure(err);
  }
  return { ok: true, message: "Un nouveau code vient d'être envoyé. Pensez à vérifier les courriers indésirables (spam)." };
}

export async function courierApplicationAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const decision = str(fd, "decision");
  try {
    if (decision === "accepter") signup.approveCourier(actor, idFrom(fd, "user_id"));
    else signup.rejectCourier(actor, idFrom(fd, "user_id"));
  } catch (err) {
    return failure(err);
  }
  refresh();
  // La demande quitte la liste « à valider » : confirmation en bandeau sur la page.
  redirect(`/livreurs?ok=${decision === "accepter" ? "accepte" : "refuse"}`);
}

export async function signupSettingAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const open = str(fd, "open") === "1";
  try {
    signup.setSignupOpen(actor, open);
  } catch (err) {
    return failure(err);
  }
  refresh();
  return { ok: true, message: open ? "Inscriptions ouvertes." : "Inscriptions fermées : la page d'inscription n'accepte plus de nouveaux comptes." };
}

/* ------------------------------------------------------------------ */
/* Notifications                                                        */
/* ------------------------------------------------------------------ */

export async function verifyMerchantAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  try {
    signup.markMerchantVerified(actor, idFrom(fd, "merchant_id"));
  } catch (err) {
    return failure(err);
  }
  refresh();
  redirect("/commercants?ok=verifie");
}

export async function markAllReadAction(): Promise<void> {
  const actor = await requireUser(["admin"]);
  notifications.markAllRead(actor);
  refresh();
}

export async function savePushSubscriptionAction(sub: { endpoint: string; p256dh: string; auth: string }): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  try {
    notifications.savePushSubscription(actor, sub);
    await notifications.sendTestPush(actor);
  } catch (err) {
    return failure(err);
  }
  refresh();
  return { ok: true, message: "Notifications activées sur cet appareil : une notification de test vient d'être envoyée." };
}

export async function deletePushSubscriptionAction(endpoint: string): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  notifications.deletePushSubscription(actor, endpoint);
  refresh();
  return { ok: true, message: "Notifications désactivées sur cet appareil." };
}

/* ------------------------------------------------------------------ */
/* Bourse aux courses, GPS, suivi public, notes, réglages               */
/* ------------------------------------------------------------------ */

export async function acceptDeliveryAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["courier"]);
  let id: number;
  try {
    id = idFrom(fd);
    deliveries.acceptDelivery(actor, id);
  } catch (err) {
    return failure(err);
  }
  refresh();
  redirect(`/commandes/${id}?ok=acceptee`);
}

/** Appelé régulièrement par le téléphone du livreur pendant la course. */
export async function reportPositionAction(id: number, lat: number, lng: number): Promise<{ ok: boolean }> {
  const actor = await requireUser(["courier"]);
  try {
    deliveries.reportPosition(actor, id, lat, lng);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function rateDeliveryAction(_: FormState, fd: FormData): Promise<FormState> {
  try {
    deliveries.rateDelivery(str(fd, "token"), Number(str(fd, "rating")), optional(fd, "comment"));
  } catch (err) {
    return failure(err);
  }
  return { ok: true, message: "Merci pour votre avis !" };
}

export async function dispatchSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["admin"]);
  const mode = str(fd, "dispatch_mode") === "bourse" ? "bourse" : "manuel";
  const tariffs: Record<string, unknown> = { vehicles: {}, options: {} };
  for (const v of VEHICLE_TYPES) {
    const n = (k: string) => parseAmount(str(fd, `${v}_${k}`));
    const base = n("base");
    const perKm = n("perKm");
    const min = n("min");
    if (base === null || perKm === null || min === null) return { ok: false, message: `Tarif « ${v} » : chiffres uniquement.` };
    (tariffs.vehicles as Record<string, unknown>)[v] = { base, perKm, min };
  }
  for (const o of Object.keys(OPTIONS)) {
    const val = parseAmount(str(fd, `option_${o}`));
    if (val === null) return { ok: false, message: "Prix des options : chiffres uniquement." };
    (tariffs.options as Record<string, unknown>)[o] = val;
  }
  run("UPDATE companies SET dispatch_mode = ?, tariffs = ? WHERE id = ?", mode, JSON.stringify(tariffs), actor.companyId);
  refresh();
  return { ok: true, message: "Réglages enregistrés." };
}

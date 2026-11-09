"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  clearLoginFailures,
  createSession,
  destroySession,
  loginLockedFor,
  recordLoginFailure,
  requireUser,
} from "@/lib/auth";
import { isDeliveryStatus, isPaymentStatus } from "@/lib/constants";
import * as deliveries from "@/lib/deliveries";
import { recordCourierRemittance, recordMerchantPayout } from "@/lib/finance";
import { formatMoney, normalizePhone, parseAmount } from "@/lib/format";
import { verifyPassword } from "@/lib/password";
import * as people from "@/lib/people";
import { getCountry, isValidPaymentMethod } from "@/lib/regions";
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
  if (!user.active || (user.role === "merchant" && !user.merchant_active))
    return { ok: false, message: "Ce compte est désactivé. Contactez l'administrateur de votre entreprise de livraison.", values: { identifier } };
  clearLoginFailures(key);
  await createSession(user.id);
  redirect(user.role === "courier" ? "/livraisons" : "/tableau-de-bord");
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
    deliveries.changeStatus(actor, id, {
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
  if (rawPhone && !phone) return invalid({ phone: "Numéro invalide, par ex. 33 800 00 00." }, fd);
  try {
    people.updateCompany(actor, str(fd, "name"), phone);
  } catch (err) {
    return failure(err, fd);
  }
  refresh();
  return { ok: true, message: "Informations de l'entreprise enregistrées." };
}

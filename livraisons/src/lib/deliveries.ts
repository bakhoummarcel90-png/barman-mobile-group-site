import {
  canTransition,
  FINAL_STATUSES,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type DeliveryStatus,
  type PaymentStatus,
} from "./constants";
import { all, get, run, transaction, type SqlValue } from "./db";
import { logEvent } from "./events";
import { filterSql, type DeliveryFilters } from "./filters";
import { formatMoney, isoToLocalInput, localInputToIso, normalizePhone, parseAmount, todayLocal } from "./format";
import { getCountry, isValidPaymentMethod, paymentMethodLabel, type CountryConfig } from "./regions";
import { deliveryScope } from "./scope";
import { onLocalDeliveryCreated, onLocalDeliveryDone } from "./shipments";
import type { Actor, Delivery, DeliveryView } from "./types";
import { optional, str, UserError, type FieldErrors } from "./validation";

/* ------------------------------------------------------------------ */
/* Lecture                                                             */
/* ------------------------------------------------------------------ */

const SELECT_VIEW = `
  SELECT d.*, m.name AS merchant_name, m.phone AS merchant_phone,
         c.name AS courier_name, c.phone AS courier_phone,
         pc.name AS confirmed_by_name
    FROM deliveries d
    JOIN merchants m ON m.id = d.merchant_id
    LEFT JOIN users c ON c.id = d.courier_id
    LEFT JOIN users pc ON pc.id = d.payment_confirmed_by`;

function tzOf(actor: Actor): string {
  return getCountry(actor.countryCode).timezone;
}

export function listDeliveries(
  actor: Actor,
  filters: DeliveryFilters,
  opts: { limit?: number; offset?: number; order?: "recent" | "schedule" } = {},
): { rows: DeliveryView[]; total: number } {
  const scope = deliveryScope(actor);
  const f = filterSql(filters, tzOf(actor));
  const where = [scope.sql, ...f.sql].join(" AND ");
  const params = [...scope.params, ...f.params];
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM deliveries d WHERE ${where}`, ...params)!.n;
  const order =
    opts.order === "schedule"
      ? "COALESCE(d.scheduled_at, d.created_at) ASC, d.id ASC"
      : "COALESCE(d.scheduled_at, d.created_at) DESC, d.id DESC";
  const rows = all<DeliveryView>(
    `${SELECT_VIEW} WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...params,
    opts.limit ?? 50,
    opts.offset ?? 0,
  );
  return { rows, total };
}

export function getDelivery(actor: Actor, id: number): DeliveryView | null {
  const scope = deliveryScope(actor);
  return get<DeliveryView>(`${SELECT_VIEW} WHERE d.id = ? AND ${scope.sql}`, id, ...scope.params) ?? null;
}

function requireDelivery(actor: Actor, id: number): DeliveryView {
  const d = getDelivery(actor, id);
  if (!d) throw new UserError("Livraison introuvable ou non accessible.");
  return d;
}

/**
 * Livraisons du jour pour un livreur : courses à faire (attribuées, en cours),
 * échecs dont le colis doit revenir au commerçant, et courses terminées aujourd'hui.
 */
export function courierDay(actor: Actor): { todo: DeliveryView[]; toReturn: DeliveryView[]; done: DeliveryView[] } {
  const tz = tzOf(actor);
  const startOfDay = localInputToIso(todayLocal(tz), tz)!;
  const scope = deliveryScope(actor);
  const todo = all<DeliveryView>(
    `${SELECT_VIEW} WHERE ${scope.sql} AND d.status IN ('en_cours','attribuee')
       ORDER BY d.status = 'en_cours' DESC, COALESCE(d.scheduled_at, d.created_at) ASC`,
    ...scope.params,
  );
  const toReturn = all<DeliveryView>(
    `${SELECT_VIEW} WHERE ${scope.sql} AND d.status = 'echec' ORDER BY d.completed_at DESC`,
    ...scope.params,
  );
  const done = all<DeliveryView>(
    `${SELECT_VIEW} WHERE ${scope.sql} AND d.status IN ('livree','retour_commercant') AND d.completed_at >= ?
       ORDER BY d.completed_at DESC`,
    ...scope.params,
    startOfDay,
  );
  return { todo, toReturn, done };
}

/* ------------------------------------------------------------------ */
/* Saisie : validation du formulaire de commande                       */
/* ------------------------------------------------------------------ */

export interface DeliveryInput {
  reference: string | null;
  merchantId: number;
  courierId: number | null;
  customerName: string;
  customerPhone: string;
  address: string;
  neighborhood: string;
  accessNotes: string | null;
  amountToCollect: number;
  expectedPaymentMethod: string;
  deliveryFee: number;
  notes: string | null;
  scheduledAt: string | null;
  /** Colis international lié (dernier kilomètre), administrateur uniquement. */
  shipmentId: number | null;
  /** Nom d'un commerçant à créer à la volée (administrateur, choix « + Nouveau commerçant »). */
  newMerchantName: string | null;
}

/** Valide le formulaire. Les messages d'erreur sont prêts à afficher. */
export function parseDeliveryForm(
  fd: FormData,
  actor: Actor,
): { data: DeliveryInput; errors: null } | { data: null; errors: FieldErrors } {
  const country = getCountry(actor.countryCode);
  const errors: FieldErrors = {};

  const reference = optional(fd, "reference");
  if (reference && !/^[\w\-#/. ]{1,40}$/u.test(reference))
    errors.reference = "Utilisez au plus 40 caractères (lettres, chiffres, tirets).";

  let merchantId = actor.merchantId ?? 0;
  let newMerchantName: string | null = null;
  if (actor.role === "admin") {
    const m = str(fd, "merchant_id");
    if (m === "new") {
      newMerchantName = str(fd, "new_merchant_name");
      if (newMerchantName.length < 2) errors.new_merchant_name = "Tapez le nom du commerçant (au moins 2 caractères).";
      else if (newMerchantName.length > 80) errors.new_merchant_name = "80 caractères maximum.";
    } else {
      merchantId = Number(m);
      if (!merchantId) errors.merchant_id = "Choisissez un commerçant, ou « + Nouveau commerçant » pour en saisir un.";
    }
  }

  let courierId: number | null = null;
  if (actor.role === "admin") {
    const c = str(fd, "courier_id");
    courierId = c ? Number(c) : null;
  }

  const customerName = str(fd, "customer_name");
  if (customerName.length < 2) errors.customer_name = "Indiquez le nom du client.";

  const rawPhone = str(fd, "customer_phone");
  const customerPhone = normalizePhone(rawPhone, country);
  if (!rawPhone) errors.customer_phone = "Indiquez le téléphone du client.";
  else if (!customerPhone)
    errors.customer_phone = `Numéro invalide : ${country.nationalNumberLength} chiffres attendus (par ex. ${country.phoneExample}), ou numéro étranger avec son indicatif (+33…).`;

  const address = str(fd, "address");
  if (address.length < 4) errors.address = "Indiquez l'adresse complète (rue, villa, immeuble…).";
  const neighborhood = str(fd, "neighborhood");
  if (neighborhood.length < 2) errors.neighborhood = "Indiquez le quartier.";

  const amountRaw = str(fd, "amount_to_collect");
  const amountToCollect = amountRaw === "" ? 0 : parseAmount(amountRaw);
  if (amountToCollect === null) errors.amount_to_collect = "Montant invalide : chiffres uniquement, par ex. 15000.";

  const expectedPaymentMethod = str(fd, "expected_payment_method");
  if (!isValidPaymentMethod(country, expectedPaymentMethod))
    errors.expected_payment_method = "Choisissez le mode de paiement attendu.";

  const feeRaw = str(fd, "delivery_fee");
  const deliveryFee = feeRaw === "" ? 0 : parseAmount(feeRaw);
  if (deliveryFee === null) errors.delivery_fee = "Frais invalides : chiffres uniquement, par ex. 1500.";

  const scheduledRaw = str(fd, "scheduled_at");
  let scheduledAt: string | null = null;
  if (scheduledRaw) {
    scheduledAt = localInputToIso(scheduledRaw, country.timezone);
    if (!scheduledAt) errors.scheduled_at = "Date et heure invalides.";
  }

  const accessNotes = optional(fd, "access_notes");
  const notes = optional(fd, "notes");
  if ((accessNotes?.length ?? 0) > 500) errors.access_notes = "500 caractères maximum.";
  if ((notes?.length ?? 0) > 1000) errors.notes = "1000 caractères maximum.";

  const shipmentRaw = actor.role === "admin" ? str(fd, "shipment_id") : "";
  const shipmentId = /^\d+$/.test(shipmentRaw) ? Number(shipmentRaw) : null;

  if (Object.keys(errors).length) return { data: null, errors };
  return {
    data: {
      newMerchantName,
      shipmentId,
      reference,
      merchantId,
      courierId,
      customerName,
      customerPhone: customerPhone!,
      address,
      neighborhood,
      accessNotes,
      amountToCollect: amountToCollect!,
      expectedPaymentMethod,
      deliveryFee: deliveryFee!,
      notes,
      scheduledAt,
    },
    errors: null,
  };
}

/** Valeurs d'une livraison existante pour pré-remplir le formulaire de modification. */
export function deliveryFormValues(d: Delivery, country: CountryConfig): Record<string, string> {
  return {
    reference: d.reference,
    merchant_id: String(d.merchant_id),
    courier_id: d.courier_id ? String(d.courier_id) : "",
    customer_name: d.customer_name,
    customer_phone: d.customer_phone,
    address: d.address,
    neighborhood: d.neighborhood,
    access_notes: d.access_notes ?? "",
    amount_to_collect: String(d.amount_to_collect),
    expected_payment_method: d.expected_payment_method,
    delivery_fee: String(d.delivery_fee),
    notes: d.notes ?? "",
    scheduled_at: isoToLocalInput(d.scheduled_at, country.timezone),
  };
}

/* ------------------------------------------------------------------ */
/* Écriture                                                            */
/* ------------------------------------------------------------------ */

function assertMerchant(actor: Actor, merchantId: number): void {
  const m = get<{ active: number }>("SELECT active FROM merchants WHERE id = ? AND company_id = ?", merchantId, actor.companyId);
  if (!m) throw new UserError("Commerçant introuvable.");
  if (!m.active) throw new UserError("Ce commerçant est désactivé : réactivez-le avant de lui créer des commandes.");
}

function assertCourier(actor: Actor, courierId: number): string {
  const c = get<{ name: string; active: number }>(
    "SELECT name, active FROM users WHERE id = ? AND company_id = ? AND role = 'courier'",
    courierId,
    actor.companyId,
  );
  if (!c) throw new UserError("Livreur introuvable.");
  if (!c.active) throw new UserError("Ce livreur est désactivé.");
  return c.name;
}

/**
 * Commerçant saisi par son nom dans le formulaire de commande : réutilise une
 * fiche existante du même nom, sinon en crée une (sans compte d'accès ; on peut
 * compléter la fiche ensuite dans la page Commerçants).
 */
function merchantFromName(actor: Actor, name: string): number {
  const existing = get<{ id: number; active: number }>(
    "SELECT id, active FROM merchants WHERE company_id = ? AND lower(trim(name)) = lower(trim(?))",
    actor.companyId,
    name,
  );
  if (existing) {
    if (!existing.active) throw new UserError(`Le commerçant « ${name} » existe mais est désactivé : réactivez-le dans la page Commerçants.`);
    return existing.id;
  }
  const { id } = run("INSERT INTO merchants (company_id, name, notes) VALUES (?, ?, ?)", actor.companyId, name.trim(), "Créé depuis une commande");
  logEvent({ companyId: actor.companyId, userId: actor.id, merchantId: id, kind: "account", message: `Commerçant ${name.trim()} créé depuis une commande` });
  return id;
}

function generateReference(companyId: number, timeZone: string): string {
  const day = todayLocal(timeZone).replace(/-/g, "").slice(2); // AAMMJJ
  const prefix = `LIV-${day}-`;
  const last = get<{ reference: string }>(
    "SELECT reference FROM deliveries WHERE company_id = ? AND reference LIKE ? ORDER BY reference DESC LIMIT 1",
    companyId,
    `${prefix}%`,
  );
  const next = last ? Number(last.reference.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

function referenceTaken(companyId: number, reference: string, exceptId = 0): boolean {
  return !!get("SELECT 1 FROM deliveries WHERE company_id = ? AND reference = ? AND id <> ?", companyId, reference, exceptId);
}

export function createDelivery(actor: Actor, input: DeliveryInput): number {
  if (actor.role === "courier") throw new UserError("Un livreur ne peut pas créer de commande.");
  const country = getCountry(actor.countryCode);
  return transaction(() => {
    const merchantId =
      actor.role === "merchant" ? actor.merchantId! : input.newMerchantName ? merchantFromName(actor, input.newMerchantName) : input.merchantId;
    assertMerchant(actor, merchantId);
    const courierName = input.courierId ? assertCourier(actor, input.courierId) : null;
    const reference = input.reference ?? generateReference(actor.companyId, country.timezone);
    if (referenceTaken(actor.companyId, reference))
      throw new UserError(`Le numéro de commande « ${reference} » existe déjà.`);
    const status: DeliveryStatus = input.courierId ? "attribuee" : "a_attribuer";
    const now = new Date().toISOString();
    const { id } = run(
      `INSERT INTO deliveries (company_id, reference, merchant_id, courier_id, customer_name, customer_phone, address,
         neighborhood, access_notes, amount_to_collect, expected_payment_method, delivery_fee, notes, scheduled_at,
         status, created_by, created_at, updated_at, shipment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      actor.companyId,
      reference,
      merchantId,
      input.courierId,
      input.customerName,
      input.customerPhone,
      input.address,
      input.neighborhood,
      input.accessNotes,
      input.amountToCollect,
      input.expectedPaymentMethod,
      input.deliveryFee,
      input.notes,
      input.scheduledAt,
      status,
      actor.id,
      now,
      now,
      input.shipmentId,
    );
    if (input.shipmentId) onLocalDeliveryCreated(actor, input.shipmentId, reference);
    logEvent({
      companyId: actor.companyId,
      userId: actor.id,
      deliveryId: id,
      kind: "created",
      toStatus: "a_attribuer",
      message: input.shipmentId ? "Commande créée pour la livraison d'un colis international" : "Commande créée",
    });
    if (courierName)
      logEvent({
        companyId: actor.companyId,
        userId: actor.id,
        deliveryId: id,
        kind: "status",
        fromStatus: "a_attribuer",
        toStatus: "attribuee",
        message: `Attribuée à ${courierName}`,
      });
    return id;
  });
}

const FIELD_LABELS: Record<string, string> = {
  reference: "numéro de commande",
  merchant_id: "commerçant",
  customer_name: "nom du client",
  customer_phone: "téléphone",
  address: "adresse",
  neighborhood: "quartier",
  access_notes: "indications d'accès",
  amount_to_collect: "montant à collecter",
  expected_payment_method: "mode de paiement",
  delivery_fee: "frais de livraison",
  notes: "notes",
  scheduled_at: "date prévue",
};

/** Peut-on modifier les informations de la commande ? */
export function canEdit(actor: Actor, d: Delivery): boolean {
  if (FINAL_STATUSES.includes(d.status)) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "merchant") return d.status === "a_attribuer" || d.status === "attribuee";
  return false;
}

export function updateDelivery(actor: Actor, id: number, input: DeliveryInput): void {
  transaction(() => {
    const d = requireDelivery(actor, id);
    if (!canEdit(actor, d))
      throw new UserError(
        actor.role === "merchant"
          ? "La course a démarré : contactez l'entreprise de livraison pour modifier cette commande."
          : "Cette livraison est terminée et ne peut plus être modifiée.",
      );
    const merchantId =
      actor.role !== "admin" ? d.merchant_id : input.newMerchantName ? merchantFromName(actor, input.newMerchantName) : input.merchantId;
    if (merchantId !== d.merchant_id) assertMerchant(actor, merchantId);
    const reference = input.reference ?? d.reference;
    if (referenceTaken(actor.companyId, reference, id))
      throw new UserError(`Le numéro de commande « ${reference} » existe déjà.`);
    if (d.payment_status !== "non_encaisse" && (input.amountToCollect !== d.amount_to_collect || input.deliveryFee !== d.delivery_fee))
      throw new UserError("Un encaissement est déjà saisi : corrigez les montants depuis la section Encaissement.");

    const next: Record<string, SqlValue> = {
      reference,
      merchant_id: merchantId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      address: input.address,
      neighborhood: input.neighborhood,
      access_notes: input.accessNotes,
      amount_to_collect: input.amountToCollect,
      expected_payment_method: input.expectedPaymentMethod,
      delivery_fee: input.deliveryFee,
      notes: input.notes,
      scheduled_at: input.scheduledAt,
    };
    const changed = Object.keys(next).filter((k) => (d as unknown as Record<string, SqlValue>)[k] !== next[k]);
    if (changed.length) {
      run(
        `UPDATE deliveries SET ${changed.map((k) => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ?`,
        ...changed.map((k) => next[k]),
        new Date().toISOString(),
        id,
      );
      logEvent({
        companyId: actor.companyId,
        userId: actor.id,
        deliveryId: id,
        kind: "edited",
        message: `Modifié : ${changed.map((k) => FIELD_LABELS[k] ?? k).join(", ")}`,
      });
    }
    // L'administrateur peut changer le livreur depuis le formulaire.
    if (actor.role === "admin" && input.courierId !== d.courier_id) {
      assignCourier(actor, id, input.courierId);
    }
  });
}

/** Attribue (ou retire) un livreur. Réservé à l'administrateur. */
export function assignCourier(actor: Actor, id: number, courierId: number | null): void {
  if (actor.role !== "admin") throw new UserError("Seul l'administrateur attribue les livraisons.");
  const d = requireDelivery(actor, id);
  if (!["a_attribuer", "attribuee", "echec"].includes(d.status))
    throw new UserError(`Impossible de changer le livreur d'une livraison « ${STATUS_LABELS[d.status]} ».`);
  if (courierId === d.courier_id && d.status === "attribuee") return;
  const now = new Date().toISOString();
  if (courierId === null) {
    run("UPDATE deliveries SET courier_id = NULL, status = 'a_attribuer', updated_at = ? WHERE id = ?", now, id);
    logEvent({
      companyId: actor.companyId,
      userId: actor.id,
      deliveryId: id,
      kind: "status",
      fromStatus: d.status,
      toStatus: "a_attribuer",
      message: d.courier_name ? `Retirée à ${d.courier_name}` : null,
    });
    return;
  }
  const name = assertCourier(actor, courierId);
  run(
    `UPDATE deliveries SET courier_id = ?, status = 'attribuee', failure_reason = CASE WHEN status = 'echec' THEN failure_reason ELSE NULL END,
       updated_at = ? WHERE id = ?`,
    courierId,
    now,
    id,
  );
  logEvent({
    companyId: actor.companyId,
    userId: actor.id,
    deliveryId: id,
    kind: "status",
    fromStatus: d.status,
    toStatus: "attribuee",
    message: d.status === "echec" ? `Nouvelle tentative confiée à ${name}` : d.courier_id ? `Réattribuée à ${name}` : `Attribuée à ${name}`,
  });
}

export interface StatusChange {
  to: DeliveryStatus;
  note?: string | null;
  failureReason?: string | null;
  collectedAmount?: number | null;
  collectedMethod?: string | null;
  proofPhoto?: string | null;
}

/**
 * Change le statut d'une livraison en respectant les transitions autorisées
 * (voir TRANSITIONS dans constants.ts) et enregistre l'historique.
 */
export function changeStatus(actor: Actor, id: number, change: StatusChange): void {
  const country = getCountry(actor.countryCode);
  transaction(() => {
    const d = requireDelivery(actor, id);
    const { to } = change;
    if (to === "attribuee" || to === "a_attribuer")
      throw new UserError("Utilisez l'attribution de livreur pour ce changement.");
    if (!canTransition(d.status, to, actor.role))
      throw new UserError(`Passage de « ${STATUS_LABELS[d.status]} » à « ${STATUS_LABELS[to]} » non autorisé.`);
    if (actor.role === "courier" && d.courier_id !== actor.id) throw new UserError("Cette livraison ne vous est pas attribuée.");

    const now = new Date().toISOString();
    const sets: string[] = ["status = ?", "updated_at = ?"];
    const params: SqlValue[] = [to, now];
    const note = change.note?.trim() || null;
    let message: string | null = note;

    if (to === "en_cours") {
      sets.push("started_at = ?");
      params.push(now);
    }

    if (to === "livree") {
      const amount = change.collectedAmount;
      if (amount === null || amount === undefined || amount < 0)
        throw new UserError("Indiquez le montant réellement encaissé (0 si rien n'a été encaissé).");
      let method = change.collectedMethod ?? null;
      if (amount > 0 && (!method || !isValidPaymentMethod(country, method)))
        throw new UserError("Indiquez le moyen de paiement utilisé par le client.");
      if (amount === 0) method = null;
      let paymentStatus: PaymentStatus = "a_verifier";
      let paymentNote: string | null = null;
      if (amount !== d.amount_to_collect) {
        paymentStatus = "ecart";
        const diff = amount - d.amount_to_collect;
        paymentNote = `Écart automatique : ${formatMoney(amount, country)} encaissés pour ${formatMoney(d.amount_to_collect, country)} attendus (${diff > 0 ? "+" : ""}${formatMoney(diff, country)}).`;
      }
      sets.push(
        "completed_at = ?",
        "collected_amount = ?",
        "collected_payment_method = ?",
        "payment_status = ?",
        "payment_note = ?",
        "failure_reason = NULL",
      );
      params.push(now, amount, method, paymentStatus, paymentNote);
      message = [
        amount > 0 ? `Encaissé ${formatMoney(amount, country)} (${paymentMethodLabel(country, method)})` : "Rien encaissé",
        paymentStatus === "ecart" ? "écart avec le montant attendu" : null,
        note,
      ]
        .filter(Boolean)
        .join(" — ");
    }

    if (to === "echec") {
      const reason = change.failureReason?.trim();
      if (!reason) throw new UserError("Indiquez la raison de l'échec.");
      sets.push("completed_at = ?", "failure_reason = ?", "collected_amount = 0", "collected_payment_method = NULL", "payment_status = 'non_encaisse'");
      params.push(now, reason);
      message = [reason, note].filter(Boolean).join(" — ");
    }

    if (to === "retour_commercant") {
      sets.push("completed_at = ?");
      params.push(now);
    }

    if (to === "annulee") {
      if (d.collected_amount) throw new UserError("Un montant a été encaissé : impossible d'annuler.");
      sets.push("payment_status = 'non_encaisse'");
    }

    if (note && actor.role === "courier") {
      sets.push("courier_note = ?");
      params.push(note);
    }
    if (change.proofPhoto) {
      sets.push("proof_photo = ?");
      params.push(change.proofPhoto);
    }

    run(`UPDATE deliveries SET ${sets.join(", ")} WHERE id = ?`, ...params, id);
    logEvent({ companyId: actor.companyId, userId: actor.id, deliveryId: id, kind: "status", fromStatus: d.status, toStatus: to, message });
    // Colis international : la remise au destinataire clôture aussi son suivi.
    if (to === "livree" && d.shipment_id) onLocalDeliveryDone(actor.companyId, actor.id, d.shipment_id);
    if (change.proofPhoto)
      logEvent({ companyId: actor.companyId, userId: actor.id, deliveryId: id, kind: "photo", message: "Photo de preuve ajoutée" });
  });
}

/** Note et/ou photo ajoutée par le livreur ou l'administrateur, sans changer le statut. */
export function addNote(actor: Actor, id: number, note: string | null, photo: string | null): void {
  transaction(() => {
    const d = requireDelivery(actor, id);
    if (actor.role === "merchant") throw new UserError("Action réservée au livreur et à l'administrateur.");
    if (!note && !photo) throw new UserError("Ajoutez une note ou une photo.");
    if (note && note.length > 1000) throw new UserError("La note est limitée à 1000 caractères.");
    const sets = ["updated_at = ?"];
    const params: SqlValue[] = [new Date().toISOString()];
    if (note && actor.role === "courier") {
      sets.push("courier_note = ?");
      params.push(d.courier_note ? `${d.courier_note}\n${note}` : note);
    }
    if (photo) {
      sets.push("proof_photo = ?");
      params.push(photo);
    }
    run(`UPDATE deliveries SET ${sets.join(", ")} WHERE id = ?`, ...params, id);
    if (note) logEvent({ companyId: actor.companyId, userId: actor.id, deliveryId: id, kind: "note", message: note });
    if (photo) logEvent({ companyId: actor.companyId, userId: actor.id, deliveryId: id, kind: "photo", message: "Photo de preuve ajoutée" });
  });
}

/* ------------------------------------------------------------------ */
/* Encaissement : vérification manuelle par l'administrateur          */
/* ------------------------------------------------------------------ */

export function reviewPayment(
  actor: Actor,
  id: number,
  input: { status: PaymentStatus; collectedAmount: number; method: string | null; note: string | null },
): void {
  if (actor.role !== "admin") throw new UserError("Seul l'administrateur confirme les encaissements.");
  const country = getCountry(actor.countryCode);
  transaction(() => {
    const d = requireDelivery(actor, id);
    if (d.status !== "livree") throw new UserError("Seules les livraisons livrées ont un encaissement à vérifier.");
    if (d.courier_settlement_id || d.merchant_settlement_id)
      throw new UserError("Ce montant fait déjà partie d'un reversement : il ne peut plus être modifié.");
    if (input.collectedAmount < 0) throw new UserError("Montant invalide.");
    if (input.collectedAmount > 0 && (!input.method || !isValidPaymentMethod(country, input.method)))
      throw new UserError("Choisissez le moyen de paiement.");
    if (input.status === "ecart" && !input.note) throw new UserError("Décrivez l'écart constaté (montant manquant, explication du livreur…).");
    if (input.status === "a_verifier") throw new UserError("Choisissez Confirmé, Écart constaté ou Non encaissé.");
    if (input.status === "non_encaisse" && input.collectedAmount !== 0)
      throw new UserError("« Non encaissé » implique un montant collecté de 0.");

    const now = new Date().toISOString();
    run(
      `UPDATE deliveries SET collected_amount = ?, collected_payment_method = ?, payment_status = ?, payment_note = ?,
         payment_confirmed_by = ?, payment_confirmed_at = ?, updated_at = ? WHERE id = ?`,
      input.collectedAmount,
      input.collectedAmount > 0 ? input.method : null,
      input.status,
      input.note,
      actor.id,
      now,
      now,
      id,
    );
    const parts = [`${PAYMENT_STATUS_LABELS[input.status]} : ${formatMoney(input.collectedAmount, country)}`];
    if (input.collectedAmount !== d.collected_amount) parts.push(`(au lieu de ${formatMoney(d.collected_amount, country)} saisis)`);
    if (input.note) parts.push(`— ${input.note}`);
    logEvent({
      companyId: actor.companyId,
      userId: actor.id,
      deliveryId: id,
      kind: "payment",
      message: `Encaissement — ${parts.join(" ")}`,
    });
  });
}

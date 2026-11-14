import { randomBytes } from "node:crypto";
import {
  isShipmentStatus,
  SHIPMENT_FINAL,
  SHIPMENT_STATUS_LABELS,
  TRANSPORT_MODES,
  type ShipmentStatus,
} from "./constants";
import { all, get, run, transaction, type SqlValue } from "./db";
import { normalizePhone, parseAmount } from "./format";
import { COUNTRIES, getCountry, SHIPMENT_CURRENCIES, SHIPPING_COUNTRIES, shippingCountryName } from "./regions";
import type { Actor } from "./types";
import { optional, str, UserError, type FieldErrors } from "./validation";

/*
 * Colis internationaux : Europe, Chine, États-Unis… ↔ Afrique de l'Ouest.
 *
 * Le suivi est MANUEL : l'entreprise met à jour les étapes (reçu, en transit,
 * arrivé, dédouanement…) d'après les informations de son transitaire ou du
 * transporteur. Aucune API de transporteur (DHL, FedEx, UPS, compagnies
 * aériennes ou maritimes) n'est connectée. Les clients suivent leur colis sur
 * la page publique /suivi avec le numéro de suivi, sans voir les données
 * personnelles ni les notes internes.
 *
 * À l'arrivée, une livraison locale (« dernier kilomètre ») peut être créée :
 * quand elle est livrée, le colis passe automatiquement à « Livré ».
 */

export interface Shipment {
  id: number;
  company_id: number;
  tracking_number: string;
  merchant_id: number | null;
  client_reference: string | null;
  transport_mode: string;
  carrier: string | null;
  carrier_tracking: string | null;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_city: string | null;
  sender_name: string;
  sender_phone: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string | null;
  description: string;
  pieces: number;
  weight_grams: number | null;
  declared_value: number | null;
  declared_currency: string | null;
  shipping_fee: number;
  fee_paid: number;
  estimated_arrival: string | null;
  status: ShipmentStatus;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ShipmentView extends Shipment {
  merchant_name: string | null;
  delivery_id: number | null;
  delivery_reference: string | null;
  delivery_status: string | null;
}

export interface ShipmentEventView {
  id: number;
  status: ShipmentStatus;
  location: string | null;
  note: string | null;
  created_at: string;
  user_name: string | null;
}

/* ------------------------------------------------------------------ */
/* Accès                                                                */
/* ------------------------------------------------------------------ */

/** Admin : toute l'entreprise ; commerçant : ses colis ; livreur : aucun. */
function scope(actor: Actor, alias = "s"): { sql: string; params: SqlValue[] } {
  if (actor.role !== "admin" && actor.role !== "merchant") return { sql: "0", params: [] };
  if (actor.role === "merchant") return { sql: `${alias}.company_id = ? AND ${alias}.merchant_id = ?`, params: [actor.companyId, actor.merchantId ?? -1] };
  return { sql: `${alias}.company_id = ?`, params: [actor.companyId] };
}

const SELECT_VIEW = `
  SELECT s.*, m.name AS merchant_name,
         (SELECT d.id FROM deliveries d WHERE d.shipment_id = s.id ORDER BY d.id DESC LIMIT 1) AS delivery_id,
         (SELECT d.reference FROM deliveries d WHERE d.shipment_id = s.id ORDER BY d.id DESC LIMIT 1) AS delivery_reference,
         (SELECT d.status FROM deliveries d WHERE d.shipment_id = s.id ORDER BY d.id DESC LIMIT 1) AS delivery_status
    FROM shipments s
    LEFT JOIN merchants m ON m.id = s.merchant_id`;

export type Direction = "import" | "export" | "transit";

/** Import : vers le pays de l'entreprise ; export : depuis ce pays ; transit : ni l'un ni l'autre. */
export function directionOf(s: Pick<Shipment, "origin_country" | "destination_country">, companyCountry: string): Direction {
  if (s.destination_country === companyCountry) return "import";
  if (s.origin_country === companyCountry) return "export";
  return "transit";
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  import: "Import (arrivée)",
  export: "Export (départ)",
  transit: "Autre trajet",
};

export interface ShipmentFilters {
  status: ShipmentStatus | "actifs" | null;
  direction: Direction | null;
  country: string | null;
  q: string;
}

type Params = Record<string, string | string[] | undefined>;
const one = (p: Params, k: string) => ((Array.isArray(p[k]) ? p[k]?.[0] : p[k]) as string | undefined)?.trim() ?? "";

export function parseShipmentFilters(p: Params): ShipmentFilters {
  const status = one(p, "statut");
  const direction = one(p, "sens");
  const country = one(p, "pays");
  return {
    status: isShipmentStatus(status) || status === "actifs" ? (status as ShipmentFilters["status"]) : null,
    direction: direction === "import" || direction === "export" || direction === "transit" ? direction : null,
    country: SHIPPING_COUNTRIES[country] ? country : null,
    q: one(p, "q").slice(0, 80),
  };
}

export function listShipments(
  actor: Actor,
  f: ShipmentFilters,
  opts: { limit?: number; offset?: number } = {},
): { rows: ShipmentView[]; total: number } {
  const sc = scope(actor);
  const where = [sc.sql];
  const params: SqlValue[] = [...sc.params];
  if (f.status === "actifs") where.push("s.status NOT IN ('livre','annule')");
  else if (f.status) {
    where.push("s.status = ?");
    params.push(f.status);
  }
  const home = getCountry(actor.countryCode).code;
  if (f.direction === "import") {
    where.push("s.destination_country = ?");
    params.push(home);
  } else if (f.direction === "export") {
    where.push("s.origin_country = ? AND s.destination_country <> ?");
    params.push(home, home);
  } else if (f.direction === "transit") {
    where.push("s.origin_country <> ? AND s.destination_country <> ?");
    params.push(home, home);
  }
  if (f.country) {
    where.push("(s.origin_country = ? OR s.destination_country = ?)");
    params.push(f.country, f.country);
  }
  if (f.q) {
    const like = `%${f.q.replace(/[%_]/g, "")}%`;
    where.push("(s.tracking_number LIKE ? OR s.carrier_tracking LIKE ? OR s.client_reference LIKE ? OR s.recipient_name LIKE ? OR s.sender_name LIKE ? OR s.description LIKE ?)");
    params.push(like, like, like, like, like, like);
  }
  const w = where.join(" AND ");
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM shipments s WHERE ${w}`, ...params)!.n;
  const rows = all<ShipmentView>(`${SELECT_VIEW} WHERE ${w} ORDER BY s.id DESC LIMIT ? OFFSET ?`, ...params, opts.limit ?? 50, opts.offset ?? 0);
  return { rows, total };
}

export function getShipment(actor: Actor, id: number): ShipmentView | null {
  const sc = scope(actor);
  return get<ShipmentView>(`${SELECT_VIEW} WHERE s.id = ? AND ${sc.sql}`, id, ...sc.params) ?? null;
}

function requireShipment(actor: Actor, id: number): ShipmentView {
  const s = getShipment(actor, id);
  if (!s) throw new UserError("Colis introuvable ou non accessible.");
  return s;
}

export function shipmentEvents(actor: Actor, shipmentId: number): ShipmentEventView[] {
  return all<ShipmentEventView>(
    `SELECT e.id, e.status, e.location, e.note, e.created_at, u.name AS user_name
       FROM shipment_events e LEFT JOIN users u ON u.id = e.user_id
      WHERE e.company_id = ? AND e.shipment_id = ? ORDER BY e.id DESC`,
    actor.companyId,
    shipmentId,
  );
}

/** Compteurs pour le tableau de bord. */
export function shipmentCounts(actor: Actor): { active: number; arrived: number } {
  const sc = scope(actor);
  const active = get<{ n: number }>(`SELECT COUNT(*) AS n FROM shipments s WHERE ${sc.sql} AND s.status NOT IN ('livre','annule')`, ...sc.params)!.n;
  // Arrivés, sans livraison locale en cours : à organiser.
  const arrived = get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM shipments s WHERE ${sc.sql} AND s.status IN ('arrive_destination','douane','pret')
       AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.shipment_id = s.id AND d.status NOT IN ('annulee','retour_commercant'))`,
    ...sc.params,
  )!.n;
  return { active, arrived };
}

/* ------------------------------------------------------------------ */
/* Saisie                                                               */
/* ------------------------------------------------------------------ */

export interface ShipmentInput {
  merchantId: number | null;
  clientReference: string | null;
  transportMode: string;
  carrier: string | null;
  carrierTracking: string | null;
  originCountry: string;
  originCity: string | null;
  destinationCountry: string;
  destinationCity: string | null;
  senderName: string;
  senderPhone: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string | null;
  description: string;
  pieces: number;
  weightGrams: number | null;
  declaredValue: number | null;
  declaredCurrency: string | null;
  shippingFee: number;
  feePaid: boolean;
  estimatedArrival: string | null;
  notes: string | null;
}

/** Téléphone d'un expéditeur/destinataire : format du pays s'il est configuré, sinon international (+…). */
function phoneFor(raw: string, countryCode: string): string | null {
  const c = COUNTRIES[countryCode];
  if (c) return normalizePhone(raw, c);
  const digits = raw.replace(/[^\d+]/g, "");
  const m = /^(?:\+|00)(\d{8,15})$/.exec(digits);
  return m ? `+${m[1]}` : null;
}

/** « 2,5 » ou « 2.5 » kg → 2500 g. */
export function parseWeight(raw: string): number | null {
  const v = raw.replace(",", ".").replace(/\s|kg/gi, "");
  if (!/^\d{1,5}(\.\d{1,3})?$/.test(v)) return null;
  return Math.round(Number(v) * 1000);
}

export function formatWeight(grams: number | null): string {
  if (grams === null) return "—";
  return `${(grams / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} kg`;
}

export function parseShipmentForm(fd: FormData, actor: Actor): { data: ShipmentInput | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  let merchantId: number | null = actor.role === "merchant" ? actor.merchantId : null;
  if (actor.role === "admin") {
    const m = str(fd, "merchant_id");
    merchantId = m ? Number(m) : null;
  }
  const transportMode = str(fd, "transport_mode");
  if (!TRANSPORT_MODES[transportMode]) errors.transport_mode = "Choisissez le mode de transport.";
  const originCountry = str(fd, "origin_country");
  if (!SHIPPING_COUNTRIES[originCountry]) errors.origin_country = "Choisissez le pays de départ.";
  const destinationCountry = str(fd, "destination_country");
  if (!SHIPPING_COUNTRIES[destinationCountry]) errors.destination_country = "Choisissez le pays d'arrivée.";
  if (originCountry && originCountry === destinationCountry) errors.destination_country = "Le pays d'arrivée doit être différent du pays de départ.";

  const senderName = str(fd, "sender_name");
  if (senderName.length < 2) errors.sender_name = "Indiquez l'expéditeur.";
  const rawSender = str(fd, "sender_phone");
  const senderPhone = rawSender ? phoneFor(rawSender, originCountry) : null;
  if (rawSender && !senderPhone) errors.sender_phone = "Numéro invalide : ajoutez l'indicatif du pays (ex. +33 6 12 34 56 78).";

  const recipientName = str(fd, "recipient_name");
  if (recipientName.length < 2) errors.recipient_name = "Indiquez le destinataire.";
  const rawRecipient = str(fd, "recipient_phone");
  const recipientPhone = rawRecipient ? phoneFor(rawRecipient, destinationCountry) : null;
  if (!rawRecipient) errors.recipient_phone = "Le téléphone du destinataire est obligatoire.";
  else if (!recipientPhone) errors.recipient_phone = "Numéro invalide : format du pays d'arrivée, ou indicatif international (+…).";

  const description = str(fd, "description");
  if (description.length < 2) errors.description = "Décrivez le contenu du colis.";
  const piecesRaw = str(fd, "pieces") || "1";
  const pieces = /^\d{1,4}$/.test(piecesRaw) && Number(piecesRaw) > 0 ? Number(piecesRaw) : null;
  if (!pieces) errors.pieces = "Nombre de colis invalide.";
  const weightRaw = str(fd, "weight_kg");
  const weightGrams = weightRaw ? parseWeight(weightRaw) : null;
  if (weightRaw && weightGrams === null) errors.weight_kg = "Poids invalide, par ex. 2,5.";

  const valueRaw = str(fd, "declared_value");
  const declaredValue = valueRaw ? parseAmount(valueRaw) : null;
  if (valueRaw && declaredValue === null) errors.declared_value = "Valeur invalide (chiffres uniquement).";
  const declaredCurrency = optional(fd, "declared_currency");
  if (declaredCurrency && !SHIPMENT_CURRENCIES.includes(declaredCurrency)) errors.declared_currency = "Devise inconnue.";

  const feeRaw = str(fd, "shipping_fee");
  const shippingFee = feeRaw === "" ? 0 : parseAmount(feeRaw);
  if (shippingFee === null) errors.shipping_fee = "Montant invalide (chiffres uniquement).";

  const eta = str(fd, "estimated_arrival");
  if (eta && !/^\d{4}-\d{2}-\d{2}$/.test(eta)) errors.estimated_arrival = "Date invalide.";

  const clientReference = optional(fd, "client_reference");
  if ((clientReference?.length ?? 0) > 60) errors.client_reference = "60 caractères maximum.";

  if (Object.keys(errors).length) return { data: null, errors };
  return {
    data: {
      merchantId,
      clientReference,
      transportMode,
      carrier: optional(fd, "carrier"),
      carrierTracking: optional(fd, "carrier_tracking"),
      originCountry,
      originCity: optional(fd, "origin_city"),
      destinationCountry,
      destinationCity: optional(fd, "destination_city"),
      senderName,
      senderPhone,
      recipientName,
      recipientPhone: recipientPhone!,
      recipientAddress: optional(fd, "recipient_address"),
      description,
      pieces: pieces!,
      weightGrams,
      declaredValue,
      declaredCurrency: declaredValue !== null ? declaredCurrency : null,
      shippingFee: shippingFee!,
      feePaid: str(fd, "fee_paid") === "1",
      estimatedArrival: eta || null,
      notes: optional(fd, "notes"),
    },
    errors,
  };
}

export function shipmentFormValues(s: Shipment): Record<string, string> {
  return {
    merchant_id: s.merchant_id ? String(s.merchant_id) : "",
    client_reference: s.client_reference ?? "",
    transport_mode: s.transport_mode,
    carrier: s.carrier ?? "",
    carrier_tracking: s.carrier_tracking ?? "",
    origin_country: s.origin_country,
    origin_city: s.origin_city ?? "",
    destination_country: s.destination_country,
    destination_city: s.destination_city ?? "",
    sender_name: s.sender_name,
    sender_phone: s.sender_phone ?? "",
    recipient_name: s.recipient_name,
    recipient_phone: s.recipient_phone,
    recipient_address: s.recipient_address ?? "",
    description: s.description,
    pieces: String(s.pieces),
    weight_kg: s.weight_grams === null ? "" : String(s.weight_grams / 1000).replace(".", ","),
    declared_value: s.declared_value === null ? "" : String(s.declared_value),
    declared_currency: s.declared_currency ?? "EUR",
    shipping_fee: String(s.shipping_fee),
    fee_paid: s.fee_paid ? "1" : "0",
    estimated_arrival: s.estimated_arrival ?? "",
    notes: s.notes ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Écriture                                                             */
/* ------------------------------------------------------------------ */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newTrackingNumber(): string {
  for (;;) {
    const code = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
    const n = `SL${code}`;
    if (!get("SELECT 1 FROM shipments WHERE tracking_number = ?", n)) return n;
  }
}

/** Accepte « sl7kq2-m9xa », espaces ou tirets : renvoie la forme canonique. */
export function normalizeTrackingNumber(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function logShipmentEvent(companyId: number, shipmentId: number, userId: number | null, status: ShipmentStatus, location: string | null, note: string | null) {
  run(
    "INSERT INTO shipment_events (company_id, shipment_id, user_id, status, location, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    companyId,
    shipmentId,
    userId,
    status,
    location,
    note,
    new Date().toISOString(),
  );
}

function assertMerchant(actor: Actor, merchantId: number | null) {
  if (merchantId === null) return;
  const m = get<{ active: number }>("SELECT active FROM merchants WHERE id = ? AND company_id = ?", merchantId, actor.companyId);
  if (!m) throw new UserError("Commerçant introuvable.");
}

export function createShipment(actor: Actor, input: ShipmentInput): number {
  if (actor.role !== "admin" && actor.role !== "merchant") throw new UserError("Action non autorisée.");
  const merchantId = actor.role === "merchant" ? actor.merchantId : input.merchantId;
  return transaction(() => {
    assertMerchant(actor, merchantId);
    const now = new Date().toISOString();
    const { id } = run(
      `INSERT INTO shipments (company_id, tracking_number, merchant_id, client_reference, transport_mode, carrier, carrier_tracking,
         origin_country, origin_city, destination_country, destination_city, sender_name, sender_phone, recipient_name, recipient_phone,
         recipient_address, description, pieces, weight_grams, declared_value, declared_currency, shipping_fee, fee_paid,
         estimated_arrival, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      actor.companyId,
      newTrackingNumber(),
      merchantId,
      input.clientReference,
      input.transportMode,
      input.carrier,
      input.carrierTracking,
      input.originCountry,
      input.originCity,
      input.destinationCountry,
      input.destinationCity,
      input.senderName,
      input.senderPhone,
      input.recipientName,
      input.recipientPhone,
      input.recipientAddress,
      input.description,
      input.pieces,
      input.weightGrams,
      input.declaredValue,
      input.declaredCurrency,
      input.shippingFee,
      input.feePaid ? 1 : 0,
      input.estimatedArrival,
      input.notes,
      actor.id,
      now,
      now,
    );
    logShipmentEvent(actor.companyId, id, actor.id, "enregistre", [input.originCity, shippingCountryName(input.originCountry)].filter(Boolean).join(", "), null);
    return id;
  });
}

export function canEditShipment(actor: Actor, s: Shipment): boolean {
  if (SHIPMENT_FINAL.includes(s.status)) return false;
  if (actor.role === "admin") return true;
  return actor.role === "merchant" && s.status === "enregistre";
}

export function updateShipment(actor: Actor, id: number, input: ShipmentInput): void {
  transaction(() => {
    const s = requireShipment(actor, id);
    if (!canEditShipment(actor, s))
      throw new UserError(
        actor.role === "merchant" ? "Le colis a été pris en charge : contactez l'entreprise pour le modifier." : "Ce colis est clôturé.",
      );
    const merchantId = actor.role === "admin" ? input.merchantId : s.merchant_id;
    assertMerchant(actor, merchantId);
    run(
      `UPDATE shipments SET merchant_id = ?, client_reference = ?, transport_mode = ?, carrier = ?, carrier_tracking = ?,
         origin_country = ?, origin_city = ?, destination_country = ?, destination_city = ?, sender_name = ?, sender_phone = ?,
         recipient_name = ?, recipient_phone = ?, recipient_address = ?, description = ?, pieces = ?, weight_grams = ?,
         declared_value = ?, declared_currency = ?, shipping_fee = ?, fee_paid = ?, estimated_arrival = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      merchantId,
      input.clientReference,
      input.transportMode,
      input.carrier,
      input.carrierTracking,
      input.originCountry,
      input.originCity,
      input.destinationCountry,
      input.destinationCity,
      input.senderName,
      input.senderPhone,
      input.recipientName,
      input.recipientPhone,
      input.recipientAddress,
      input.description,
      input.pieces,
      input.weightGrams,
      input.declaredValue,
      input.declaredCurrency,
      input.shippingFee,
      input.feePaid ? 1 : 0,
      input.estimatedArrival,
      input.notes,
      new Date().toISOString(),
      id,
    );
  });
}

/** Nouvelle étape de suivi (administrateur). */
export function changeShipmentStatus(actor: Actor, id: number, change: { status: ShipmentStatus; location: string | null; note: string | null }): void {
  if (actor.role !== "admin") throw new UserError("Seul l'administrateur met à jour le suivi des colis.");
  transaction(() => {
    const s = requireShipment(actor, id);
    if (SHIPMENT_FINAL.includes(s.status)) throw new UserError(`Ce colis est « ${SHIPMENT_STATUS_LABELS[s.status]} » : le suivi est clôturé.`);
    if (change.status === "incident" && !change.note) throw new UserError("Décrivez l'incident (retard, colis bloqué en douane, document manquant…).");
    if ((change.location?.length ?? 0) > 120 || (change.note?.length ?? 0) > 500) throw new UserError("Texte trop long.");
    run("UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?", change.status, new Date().toISOString(), id);
    logShipmentEvent(actor.companyId, id, actor.id, change.status, change.location, change.note);
  });
}

/** Appelé à la création d'une livraison locale liée à un colis. */
export function onLocalDeliveryCreated(actor: Actor, shipmentId: number, deliveryReference: string): void {
  const s = requireShipment(actor, shipmentId);
  if (SHIPMENT_FINAL.includes(s.status)) throw new UserError("Ce colis est déjà clôturé.");
  run("UPDATE shipments SET status = 'pret', updated_at = ? WHERE id = ?", new Date().toISOString(), shipmentId);
  logShipmentEvent(actor.companyId, shipmentId, actor.id, "pret", s.destination_city, `Livraison locale ${deliveryReference} programmée`);
}

/** Appelé quand la livraison locale liée est livrée. */
export function onLocalDeliveryDone(companyId: number, userId: number, shipmentId: number): void {
  const s = get<{ status: ShipmentStatus; destination_city: string | null }>(
    "SELECT status, destination_city FROM shipments WHERE id = ? AND company_id = ?",
    shipmentId,
    companyId,
  );
  if (!s || SHIPMENT_FINAL.includes(s.status)) return;
  run("UPDATE shipments SET status = 'livre', updated_at = ? WHERE id = ?", new Date().toISOString(), shipmentId);
  logShipmentEvent(companyId, shipmentId, userId, "livre", s.destination_city, "Remis au destinataire");
}

/* ------------------------------------------------------------------ */
/* Suivi public                                                         */
/* ------------------------------------------------------------------ */

export interface PublicTracking {
  tracking_number: string;
  company_name: string;
  company_phone: string | null;
  company_country: string;
  /** Boutique cliente (affichée « Colis de … ») ; null pour un particulier. */
  merchant_name: string | null;
  status: ShipmentStatus;
  transport_mode: string;
  origin: string;
  destination: string;
  pieces: number;
  estimated_arrival: string | null;
  events: { status: ShipmentStatus; location: string | null; created_at: string }[];
}

/** Informations visibles par le client : étapes et villes, sans données personnelles ni notes internes. */
export function publicTracking(raw: string): PublicTracking | null {
  const n = normalizeTrackingNumber(raw);
  if (!/^SL[A-Z0-9]{8}$/.test(n)) return null;
  const s = get<Shipment & { company_name: string; company_phone: string | null; company_country: string; merchant_name: string | null }>(
    `SELECT s.*, c.name AS company_name, c.phone AS company_phone, c.country_code AS company_country, m.name AS merchant_name
       FROM shipments s JOIN companies c ON c.id = s.company_id LEFT JOIN merchants m ON m.id = s.merchant_id
      WHERE s.tracking_number = ?`,
    n,
  );
  if (!s) return null;
  const events = all<{ status: ShipmentStatus; location: string | null; created_at: string }>(
    "SELECT status, location, created_at FROM shipment_events WHERE shipment_id = ? ORDER BY id DESC",
    s.id,
  );
  return {
    tracking_number: s.tracking_number,
    company_name: s.company_name,
    company_phone: s.company_phone,
    company_country: s.company_country,
    merchant_name: s.merchant_name,
    status: s.status,
    transport_mode: s.transport_mode,
    origin: [s.origin_city, shippingCountryName(s.origin_country)].filter(Boolean).join(", "),
    destination: [s.destination_city, shippingCountryName(s.destination_country)].filter(Boolean).join(", "),
    pieces: s.pieces,
    estimated_arrival: s.estimated_arrival,
    events,
  };
}

/** Lien de suivi chez le transporteur, pour les transporteurs express connus (pages publiques). */
export function carrierTrackingUrl(carrier: string | null, number: string | null): string | null {
  if (!carrier || !number) return null;
  const c = carrier.toLowerCase();
  const n = encodeURIComponent(number.trim());
  if (c.includes("dhl")) return `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${n}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${n}`;
  return null;
}

/** « Boutique Marcel & Fils » → « boutique-marcel-fils » (pour les liens de suivi). */
export function slugify(name: string): string {
  return name
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Chemin public de suivi : avec le nom de la boutique quand le colis en a une
 * (« /suivi/boutique-marcel/SLKCY2BBWN »), sinon « /suivi/SLKCY2BBWN ».
 */
export function trackingPath(trackingNumber: string, merchantName: string | null): string {
  const slug = merchantName ? slugify(merchantName) : "";
  return slug ? `/suivi/${slug}/${trackingNumber}` : `/suivi/${trackingNumber}`;
}

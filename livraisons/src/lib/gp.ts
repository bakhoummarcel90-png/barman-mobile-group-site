import { randomBytes } from "node:crypto";
import { getCompany } from "./company";
import { all, get, run, transaction, type SqlValue } from "./db";
import { logEvent } from "./events";
import { formatMoney, normalizePhone, parseAmount, todayLocal } from "./format";
import { notifyAdmins, notifyUser } from "./notifications";
import { getCountry, isValidPaymentMethod, paymentMethodLabel, SHIPPING_COUNTRIES, shippingCountryName } from "./regions";
import { formatWeight, parseWeight } from "./shipments";
import type { Actor } from "./types";
import { optional, str, UserError, type FieldErrors } from "./validation";

/*
 * Module GP : les « GP » sont des voyageurs qui transportent des colis dans
 * leurs bagages entre le Sénégal et d'autres pays, payés au kilo.
 *
 *  - Le GP (compte validé par l'administrateur) publie ses voyages : trajet,
 *    dates, kilos disponibles, prix au kilo, lieu de dépôt.
 *  - L'expéditeur (compte commerçant ou particulier) réserve des kilos. Il
 *    paie des frais de mise en relation (montant fixe réglable) par Wave ou
 *    Orange Money sur le numéro de l'entreprise, puis déclare son paiement.
 *  - L'administrateur vérifie le paiement : la réservation est confirmée et
 *    les contacts (GP ↔ expéditeur) sont alors seulement dévoilés.
 * Aucun paiement n'est encaissé automatiquement par l'application.
 */

export const TRIP_STATUSES = ["ouvert", "complet", "annule"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = { ouvert: "Ouvert", complet: "Complet", annule: "Annulé" };

export const BOOKING_STATUSES = ["a_payer", "a_verifier", "confirmee", "livree", "annulee"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  a_payer: "Frais à payer",
  a_verifier: "Paiement à vérifier",
  confirmee: "Confirmée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const TRIP_CURRENCIES = ["XOF", "EUR", "USD"] as const;
const CURRENCY_LABELS: Record<string, string> = { XOF: "FCFA", EUR: "€", USD: "$" };

/** Objets refusés : l'expéditeur les accepte avant de réserver. */
export const PROHIBITED_ITEMS = [
  "Argent liquide, bijoux de valeur",
  "Médicaments sans ordonnance, drogues",
  "Armes, munitions, objets tranchants",
  "Produits inflammables, gaz, batteries seules",
  "Denrées périssables non emballées",
  "Contrefaçons et tout produit interdit dans le pays d'arrivée",
];

/** Kilos qu'un voyage peut proposer au plus. */
const MAX_CAPACITY_GRAMS = 300_000;

export interface GpTrip {
  id: number;
  company_id: number;
  gp_id: number;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  departure_date: string;
  arrival_date: string | null;
  capacity_grams: number;
  price_per_kg: number;
  currency: string;
  dropoff_place: string | null;
  deadline_date: string | null;
  notes: string | null;
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface GpTripView extends GpTrip {
  gp_name: string;
  /** Grammes déjà réservés (réservations non annulées). */
  reserved_grams: number;
  rating_avg: number | null;
  rating_count: number;
  booking_count: number;
  to_verify_count: number;
}

export interface GpBooking {
  id: number;
  company_id: number;
  reference: string;
  trip_id: number;
  sender_id: number;
  weight_grams: number;
  description: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string | null;
  fee: number;
  payment_method: string | null;
  payment_reference: string | null;
  payment_declared_at: string | null;
  status: BookingStatus;
  admin_note: string | null;
  confirmed_by: number | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  rating: number | null;
  rating_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface GpBookingView extends GpBooking {
  sender_name: string;
  sender_phone: string | null;
  gp_id: number;
  gp_name: string;
  gp_phone: string | null;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  departure_date: string;
  arrival_date: string | null;
  price_per_kg: number;
  currency: string;
  dropoff_place: string | null;
  deadline_date: string | null;
  trip_status: TripStatus;
}

/* ---------- Affichage ---------- */

const DAY_FMT = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });

/** « 2026-12-05 » → « sam. 5 décembre ». */
export function dayLabel(day: string | null): string {
  if (!day) return "—";
  return DAY_FMT.format(new Date(`${day}T00:00:00Z`));
}

export function routeLabel(t: Pick<GpTrip, "origin_city" | "origin_country" | "destination_city" | "destination_country">): string {
  return `${t.origin_city} (${shippingCountryName(t.origin_country)}) → ${t.destination_city} (${shippingCountryName(t.destination_country)})`;
}

/** Montant dans la devise du voyage : « 7 000 FCFA », « 8 € ». */
export function moneyIn(amount: number, currency: string): string {
  return `${amount.toLocaleString("fr-FR").replace(/\u202f/g, "\u00a0")}\u00a0${CURRENCY_LABELS[currency] ?? currency}`;
}

export function pricePerKgLabel(t: Pick<GpTrip, "price_per_kg" | "currency">): string {
  return `${moneyIn(t.price_per_kg, t.currency)} / kg`;
}

/** Prénom + initiale : affiché publiquement (« Awa D. »). */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "GP";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function remainingGrams(t: Pick<GpTripView, "capacity_grams" | "reserved_grams">): number {
  return Math.max(0, t.capacity_grams - t.reserved_grams);
}

/** « 2 » → « 2 kg » (affichage des kilos). */
export { formatWeight };

/** Une réservation dévoile les contacts une fois les frais confirmés. */
export function contactsVisible(b: Pick<GpBooking, "status">): boolean {
  return b.status === "confirmee" || b.status === "livree";
}

/* ---------- Réglages ---------- */

export interface GpSettings {
  fee: number;
  paymentInfo: string | null;
}

export function gpSettings(companyId: number): GpSettings {
  const c = get<{ gp_fee: number; gp_payment_info: string | null }>("SELECT gp_fee, gp_payment_info FROM companies WHERE id = ?", companyId);
  return { fee: c?.gp_fee ?? 1000, paymentInfo: c?.gp_payment_info ?? null };
}

export function saveGpSettings(actor: Actor, fd: FormData): { errors: FieldErrors } {
  if (actor.role !== "admin") throw new UserError("Action réservée à l'administrateur.");
  const errors: FieldErrors = {};
  const fee = parseAmount(str(fd, "gp_fee"));
  if (fee === null) errors.gp_fee = "Montant invalide : chiffres uniquement, par ex. 1000 (0 = gratuit).";
  const info = optional(fd, "gp_payment_info");
  if (info && info.length > 500) errors.gp_payment_info = "500 caractères au maximum.";
  if (fee && !info) errors.gp_payment_info = "Indiquez le numéro Wave ou Orange Money où les expéditeurs paient les frais.";
  if (Object.keys(errors).length) return { errors };
  run("UPDATE companies SET gp_fee = ?, gp_payment_info = ? WHERE id = ?", fee, info, actor.companyId);
  return { errors };
}

/* ---------- Voyages ---------- */

export interface TripInput {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  departureDate: string;
  arrivalDate: string | null;
  deadlineDate: string | null;
  capacityGrams: number;
  pricePerKg: number;
  currency: string;
  dropoffPlace: string | null;
  notes: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseTripForm(fd: FormData, today: string): { data: TripInput | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const originCountry = str(fd, "origin_country");
  const destinationCountry = str(fd, "destination_country");
  if (!(originCountry in SHIPPING_COUNTRIES)) errors.origin_country = "Choisissez le pays de départ.";
  if (!(destinationCountry in SHIPPING_COUNTRIES)) errors.destination_country = "Choisissez le pays d'arrivée.";
  const originCity = str(fd, "origin_city");
  const destinationCity = str(fd, "destination_city");
  if (originCity.length < 2) errors.origin_city = "Indiquez la ville de départ.";
  if (destinationCity.length < 2) errors.destination_city = "Indiquez la ville d'arrivée.";
  if (!errors.destination_country && originCountry === destinationCountry && originCity.toLowerCase() === destinationCity.toLowerCase())
    errors.destination_city = "Le départ et l'arrivée sont identiques.";
  const departureDate = str(fd, "departure_date");
  if (!DATE_RE.test(departureDate)) errors.departure_date = "Indiquez la date de départ.";
  else if (departureDate < today) errors.departure_date = "La date de départ est déjà passée.";
  const arrivalDate = optional(fd, "arrival_date");
  if (arrivalDate && (!DATE_RE.test(arrivalDate) || (DATE_RE.test(departureDate) && arrivalDate < departureDate)))
    errors.arrival_date = "La date d'arrivée doit être le jour du départ ou après.";
  const deadlineDate = optional(fd, "deadline_date");
  if (deadlineDate && (!DATE_RE.test(deadlineDate) || (DATE_RE.test(departureDate) && deadlineDate > departureDate)))
    errors.deadline_date = "Le dernier jour de dépôt doit être avant le départ (ou le jour même).";
  const capacityGrams = parseWeight(str(fd, "capacity_kg"));
  if (capacityGrams === null || capacityGrams <= 0) errors.capacity_kg = "Indiquez les kilos disponibles, par ex. 23.";
  else if (capacityGrams > MAX_CAPACITY_GRAMS) errors.capacity_kg = "300 kg au maximum par voyage.";
  const pricePerKg = parseAmount(str(fd, "price_per_kg"));
  if (pricePerKg === null || pricePerKg <= 0) errors.price_per_kg = "Indiquez le prix d'un kilo, par ex. 7000.";
  const currency = str(fd, "currency") || "XOF";
  if (!(TRIP_CURRENCIES as readonly string[]).includes(currency)) errors.currency = "Devise non prise en charge.";
  const dropoffPlace = optional(fd, "dropoff_place");
  const notes = optional(fd, "notes");
  if (notes && notes.length > 1000) errors.notes = "1000 caractères au maximum.";
  if (Object.keys(errors).length) return { data: null, errors };
  return {
    data: {
      originCountry,
      originCity,
      destinationCountry,
      destinationCity,
      departureDate,
      arrivalDate,
      deadlineDate,
      capacityGrams: capacityGrams!,
      pricePerKg: pricePerKg!,
      currency,
      dropoffPlace,
      notes,
    },
    errors,
  };
}

export function tripFormValues(t: GpTrip): Record<string, string> {
  return {
    origin_country: t.origin_country,
    origin_city: t.origin_city,
    destination_country: t.destination_country,
    destination_city: t.destination_city,
    departure_date: t.departure_date,
    arrival_date: t.arrival_date ?? "",
    deadline_date: t.deadline_date ?? "",
    capacity_kg: String(t.capacity_grams / 1000).replace(".", ","),
    price_per_kg: String(t.price_per_kg),
    currency: t.currency,
    dropoff_place: t.dropoff_place ?? "",
    notes: t.notes ?? "",
  };
}

const TRIP_VIEW = `
  SELECT t.*, g.name AS gp_name,
    COALESCE((SELECT SUM(b.weight_grams) FROM gp_bookings b WHERE b.trip_id = t.id AND b.status <> 'annulee'), 0) AS reserved_grams,
    (SELECT COUNT(*) FROM gp_bookings b WHERE b.trip_id = t.id AND b.status <> 'annulee') AS booking_count,
    (SELECT COUNT(*) FROM gp_bookings b WHERE b.trip_id = t.id AND b.status = 'a_verifier') AS to_verify_count,
    (SELECT ROUND(AVG(b.rating), 1) FROM gp_bookings b JOIN gp_trips t2 ON t2.id = b.trip_id WHERE t2.gp_id = t.gp_id AND b.rating IS NOT NULL) AS rating_avg,
    (SELECT COUNT(*) FROM gp_bookings b JOIN gp_trips t2 ON t2.id = b.trip_id WHERE t2.gp_id = t.gp_id AND b.rating IS NOT NULL) AS rating_count
  FROM gp_trips t JOIN users g ON g.id = t.gp_id`;

function requireGp(actor: Actor) {
  if (actor.role !== "gp") throw new UserError("Action réservée aux GP.");
}

export function createTrip(actor: Actor, input: TripInput): number {
  requireGp(actor);
  const id = run(
    `INSERT INTO gp_trips (company_id, gp_id, origin_country, origin_city, destination_country, destination_city, departure_date,
       arrival_date, deadline_date, capacity_grams, price_per_kg, currency, dropoff_place, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    actor.companyId,
    actor.id,
    input.originCountry,
    input.originCity,
    input.destinationCountry,
    input.destinationCity,
    input.departureDate,
    input.arrivalDate,
    input.deadlineDate,
    input.capacityGrams,
    input.pricePerKg,
    input.currency,
    input.dropoffPlace,
    input.notes,
  ).id;
  logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: actor.id, kind: "gp", message: `Voyage GP publié : ${routeLabel({ origin_city: input.originCity, origin_country: input.originCountry, destination_city: input.destinationCity, destination_country: input.destinationCountry })} le ${dayLabel(input.departureDate)}` });
  return id;
}

/** Voyage accessible en écriture : le GP propriétaire (ou l'administrateur). */
function ownTrip(actor: Actor, id: number): GpTripView {
  const t = get<GpTripView>(`${TRIP_VIEW} WHERE t.id = ? AND t.company_id = ?`, id, actor.companyId);
  if (!t || (actor.role !== "admin" && !(actor.role === "gp" && t.gp_id === actor.id))) throw new UserError("Voyage introuvable.");
  return t;
}

export function updateTrip(actor: Actor, id: number, input: TripInput): void {
  transaction(() => {
    const t = ownTrip(actor, id);
    if (t.status === "annule") throw new UserError("Ce voyage est annulé : publiez un nouveau voyage.");
    if (input.capacityGrams < t.reserved_grams)
      throw new UserError(`Déjà ${formatWeight(t.reserved_grams)} réservés : les kilos disponibles ne peuvent pas être inférieurs.`);
    run(
      `UPDATE gp_trips SET origin_country = ?, origin_city = ?, destination_country = ?, destination_city = ?, departure_date = ?,
         arrival_date = ?, deadline_date = ?, capacity_grams = ?, price_per_kg = ?, currency = ?, dropoff_place = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      input.originCountry,
      input.originCity,
      input.destinationCountry,
      input.destinationCity,
      input.departureDate,
      input.arrivalDate,
      input.deadlineDate,
      input.capacityGrams,
      input.pricePerKg,
      input.currency,
      input.dropoffPlace,
      input.notes,
      new Date().toISOString(),
      id,
    );
  });
}

/** Ouvert ↔ complet ; annulation (annule aussi les réservations non confirmées). */
export function setTripStatus(actor: Actor, id: number, status: TripStatus): void {
  transaction(() => {
    const t = ownTrip(actor, id);
    if (t.status === "annule") throw new UserError("Ce voyage est déjà annulé.");
    const now = new Date().toISOString();
    if (status === "annule") {
      const confirmed = get<{ n: number }>("SELECT COUNT(*) AS n FROM gp_bookings WHERE trip_id = ? AND status = 'confirmee'", id)!.n;
      if (confirmed && actor.role !== "admin")
        throw new UserError(`${confirmed} réservation(s) confirmée(s) : prévenez les expéditeurs et contactez l'administrateur pour annuler.`);
      const affected = all<{ id: number; sender_id: number; reference: string }>(
        "SELECT id, sender_id, reference FROM gp_bookings WHERE trip_id = ? AND status IN ('a_payer','a_verifier','confirmee')",
        id,
      );
      run("UPDATE gp_bookings SET status = 'annulee', updated_at = ? WHERE trip_id = ? AND status IN ('a_payer','a_verifier','confirmee')", now, id);
      for (const b of affected)
        notifyUser(t.company_id, b.sender_id, { title: "Voyage GP annulé", body: `Le voyage ${routeLabel(t)} du ${dayLabel(t.departure_date)} est annulé (réservation ${b.reference}).`, url: `/gp/reservations/${b.id}` });
    }
    run("UPDATE gp_trips SET status = ?, updated_at = ? WHERE id = ?", status, now, id);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: t.gp_id, kind: "gp", message: `Voyage ${routeLabel(t)} du ${dayLabel(t.departure_date)} : ${TRIP_STATUS_LABELS[status]}` });
  });
}

export interface TripFilters {
  from?: string;
  to?: string;
  month?: string; // AAAA-MM
}

/** Voyages ouverts à venir, avec des kilos restants (liste publique et expéditeurs). */
export function openTrips(companyId: number, f: TripFilters = {}): GpTripView[] {
  const tz = getCountry(getCompany(companyId).country_code).timezone;
  const where = ["t.company_id = ?", "t.status = 'ouvert'", "t.departure_date >= ?", "g.active = 1"];
  const params: SqlValue[] = [companyId, todayLocal(tz)];
  if (f.from && f.from in SHIPPING_COUNTRIES) {
    where.push("t.origin_country = ?");
    params.push(f.from);
  }
  if (f.to && f.to in SHIPPING_COUNTRIES) {
    where.push("t.destination_country = ?");
    params.push(f.to);
  }
  if (f.month && /^\d{4}-\d{2}$/.test(f.month)) {
    where.push("substr(t.departure_date, 1, 7) = ?");
    params.push(f.month);
  }
  return all<GpTripView>(`${TRIP_VIEW} WHERE ${where.join(" AND ")} ORDER BY t.departure_date, t.id LIMIT 200`, ...params).filter((t) => remainingGrams(t) > 0);
}

/** Voyages du GP connecté (ou de tous les GP pour l'administrateur). */
export function listTrips(actor: Actor): GpTripView[] {
  if (actor.role === "gp") return all<GpTripView>(`${TRIP_VIEW} WHERE t.gp_id = ? ORDER BY t.departure_date DESC, t.id DESC`, actor.id);
  if (actor.role === "admin") return all<GpTripView>(`${TRIP_VIEW} WHERE t.company_id = ? ORDER BY t.departure_date DESC, t.id DESC LIMIT 300`, actor.companyId);
  return [];
}

/**
 * Voyage visible par l'utilisateur : le GP propriétaire et l'administrateur
 * toujours ; les expéditeurs seulement s'il est ouvert (ou s'ils y ont réservé).
 */
export function getTrip(actor: Actor, id: number): GpTripView | null {
  const t = get<GpTripView>(`${TRIP_VIEW} WHERE t.id = ? AND t.company_id = ?`, id, actor.companyId);
  if (!t) return null;
  if (actor.role === "admin" || (actor.role === "gp" && t.gp_id === actor.id)) return t;
  if (actor.role === "merchant") {
    if (t.status === "ouvert") return t;
    const mine = get("SELECT 1 FROM gp_bookings WHERE trip_id = ? AND sender_id = ?", id, actor.id);
    return mine ? t : null;
  }
  return null;
}

export function canManageTrip(actor: Actor, t: Pick<GpTrip, "gp_id">): boolean {
  return actor.role === "admin" || (actor.role === "gp" && t.gp_id === actor.id);
}

/* ---------- Réservations ---------- */

export interface BookingInput {
  weightGrams: number;
  description: string;
  recipientName: string;
  recipientPhone: string;
  recipientCity: string | null;
}

export function parseBookingForm(fd: FormData, countryCode: string): { data: BookingInput | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const weightGrams = parseWeight(str(fd, "weight_kg"));
  if (weightGrams === null || weightGrams <= 0) errors.weight_kg = "Indiquez le poids en kilos, par ex. 3 ou 2,5.";
  const description = str(fd, "description");
  if (description.length < 3) errors.description = "Décrivez le contenu du colis (vêtements, documents…).";
  else if (description.length > 300) errors.description = "300 caractères au maximum.";
  const recipientName = str(fd, "recipient_name");
  if (recipientName.length < 2) errors.recipient_name = "Indiquez le nom du destinataire.";
  const rawPhone = str(fd, "recipient_phone");
  const recipientPhone = normalizePhone(rawPhone, getCountry(countryCode));
  if (!rawPhone) errors.recipient_phone = "Le téléphone du destinataire est obligatoire.";
  else if (!recipientPhone) errors.recipient_phone = "Numéro invalide. Pour l'étranger, commencez par l'indicatif (ex. +33 6 12 34 56 78).";
  if (str(fd, "accept_rules") !== "1") errors.accept_rules = "Confirmez que le colis ne contient aucun objet interdit.";
  if (Object.keys(errors).length) return { data: null, errors };
  return { data: { weightGrams: weightGrams!, description, recipientName, recipientPhone: recipientPhone!, recipientCity: optional(fd, "recipient_city") }, errors };
}

const BOOKING_VIEW = `
  SELECT b.*, s.name AS sender_name, s.phone AS sender_phone,
    t.gp_id, g.name AS gp_name, g.phone AS gp_phone,
    t.origin_country, t.origin_city, t.destination_country, t.destination_city, t.departure_date, t.arrival_date,
    t.price_per_kg, t.currency, t.dropoff_place, t.deadline_date, t.status AS trip_status
  FROM gp_bookings b
  JOIN gp_trips t ON t.id = b.trip_id
  JOIN users s ON s.id = b.sender_id
  JOIN users g ON g.id = t.gp_id`;

/**
 * Masque ce que l'utilisateur ne doit pas voir : les téléphones du GP et de
 * l'expéditeur ne sont dévoilés qu'après confirmation des frais.
 */
function redact(actor: Actor, b: GpBookingView): GpBookingView {
  if (actor.role === "admin" || contactsVisible(b)) return b;
  return { ...b, gp_phone: null, sender_phone: null, recipient_phone: actor.role === "gp" ? "" : b.recipient_phone };
}

function newReference(companyId: number, today: string): string {
  const prefix = `GP-${today.slice(2).replace(/-/g, "")}-`;
  const n = get<{ n: number }>("SELECT COUNT(*) AS n FROM gp_bookings WHERE company_id = ? AND reference LIKE ?", companyId, `${prefix}%`)!.n;
  let ref = `${prefix}${String(n + 1).padStart(3, "0")}`;
  if (get("SELECT 1 FROM gp_bookings WHERE reference = ?", ref)) ref = `${prefix}${randomBytes(3).toString("hex").toUpperCase()}`;
  return ref;
}

export function createBooking(actor: Actor, tripId: number, input: BookingInput): number {
  if (actor.role !== "merchant") throw new UserError("Connectez-vous avec un compte commerçant ou particulier pour réserver.");
  const company = getCompany(actor.companyId);
  const today = todayLocal(getCountry(company.country_code).timezone);
  const { fee } = gpSettings(actor.companyId);
  return transaction(() => {
    const t = get<GpTripView>(`${TRIP_VIEW} WHERE t.id = ? AND t.company_id = ?`, tripId, actor.companyId);
    if (!t || t.status !== "ouvert" || t.departure_date < today) throw new UserError("Ce voyage n'accepte plus de réservations.");
    if (t.deadline_date && t.deadline_date < today) throw new UserError("La date limite de dépôt de ce voyage est passée.");
    const left = remainingGrams(t);
    if (input.weightGrams > left) throw new UserError(`Il reste seulement ${formatWeight(left)} sur ce voyage.`);
    const now = new Date().toISOString();
    const free = fee === 0;
    const reference = newReference(actor.companyId, today);
    const id = run(
      `INSERT INTO gp_bookings (company_id, reference, trip_id, sender_id, weight_grams, description, recipient_name, recipient_phone,
         recipient_city, fee, status, confirmed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      actor.companyId,
      reference,
      tripId,
      actor.id,
      input.weightGrams,
      input.description,
      input.recipientName,
      input.recipientPhone,
      input.recipientCity,
      fee,
      free ? "confirmee" : "a_payer",
      free ? now : null,
      now,
      now,
    ).id;
    if (remainingGrams(t) - input.weightGrams <= 0) run("UPDATE gp_trips SET status = 'complet', updated_at = ? WHERE id = ?", now, tripId);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: t.gp_id, kind: "gp", message: `Réservation ${reference} : ${formatWeight(input.weightGrams)} sur ${routeLabel(t)}` });
    if (free)
      notifyUser(actor.companyId, t.gp_id, {
        title: "Nouvelle réservation confirmée",
        body: `${formatWeight(input.weightGrams)} pour ${routeLabel(t)} le ${dayLabel(t.departure_date)}. Les coordonnées de l'expéditeur sont disponibles.`,
        url: `/gp/reservations/${id}`,
      });
    return id;
  });
}

export function getBooking(actor: Actor, id: number): GpBookingView | null {
  const b = get<GpBookingView>(`${BOOKING_VIEW} WHERE b.id = ? AND b.company_id = ?`, id, actor.companyId);
  if (!b) return null;
  if (actor.role === "admin" || (actor.role === "merchant" && b.sender_id === actor.id) || (actor.role === "gp" && b.gp_id === actor.id)) return redact(actor, b);
  return null;
}

/** Réservations faites par l'expéditeur connecté. */
export function myBookings(actor: Actor): GpBookingView[] {
  if (actor.role !== "merchant") return [];
  return all<GpBookingView>(`${BOOKING_VIEW} WHERE b.sender_id = ? ORDER BY b.id DESC LIMIT 200`, actor.id).map((b) => redact(actor, b));
}

/** Réservations d'un voyage (GP propriétaire ou administrateur). */
export function tripBookings(actor: Actor, tripId: number): GpBookingView[] {
  const t = get<GpTrip>("SELECT * FROM gp_trips WHERE id = ? AND company_id = ?", tripId, actor.companyId);
  if (!t || !canManageTrip(actor, t)) return [];
  return all<GpBookingView>(`${BOOKING_VIEW} WHERE b.trip_id = ? ORDER BY b.id`, tripId).map((b) => redact(actor, b));
}

/** Paiements déclarés, à vérifier par l'administrateur. */
export function bookingsToVerify(actor: Actor): GpBookingView[] {
  if (actor.role !== "admin") return [];
  return all<GpBookingView>(`${BOOKING_VIEW} WHERE b.company_id = ? AND b.status = 'a_verifier' ORDER BY b.payment_declared_at`, actor.companyId);
}

export function recentBookings(actor: Actor, limit = 50): GpBookingView[] {
  if (actor.role !== "admin") return [];
  return all<GpBookingView>(`${BOOKING_VIEW} WHERE b.company_id = ? ORDER BY b.id DESC LIMIT ?`, actor.companyId, limit);
}

function bookingFor(actor: Actor, id: number): GpBookingView {
  const b = get<GpBookingView>(`${BOOKING_VIEW} WHERE b.id = ? AND b.company_id = ?`, id, actor.companyId);
  if (!b) throw new UserError("Réservation introuvable.");
  return b;
}

/** L'expéditeur indique comment il a payé les frais (Wave, Orange Money…) et la référence du transfert. */
export function declarePayment(actor: Actor, id: number, method: string, reference: string): void {
  const country = getCountry(actor.countryCode);
  if (!isValidPaymentMethod(country, method) || method === "cash") throw new UserError("Choisissez le moyen de paiement utilisé (Wave, Orange Money…).");
  if (reference.length < 4 || reference.length > 60) throw new UserError("Indiquez la référence du transfert (reçue par SMS), 4 caractères au moins.");
  transaction(() => {
    const b = bookingFor(actor, id);
    if (actor.role !== "merchant" || b.sender_id !== actor.id) throw new UserError("Réservation introuvable.");
    if (b.status !== "a_payer") throw new UserError("Le paiement de cette réservation a déjà été déclaré.");
    const now = new Date().toISOString();
    run(
      "UPDATE gp_bookings SET status = 'a_verifier', payment_method = ?, payment_reference = ?, payment_declared_at = ?, admin_note = NULL, updated_at = ? WHERE id = ?",
      method,
      reference,
      now,
      now,
      id,
    );
    logEvent({ companyId: actor.companyId, userId: actor.id, kind: "gp", message: `Paiement déclaré pour ${b.reference} (${paymentMethodLabel(country, method)}, réf. ${reference})` });
    notifyAdmins(actor.companyId, {
      title: "Paiement GP à vérifier",
      body: `${b.sender_name} déclare avoir payé ${formatMoney(b.fee, country)} (${paymentMethodLabel(country, method)}, réf. ${reference}) — ${b.reference}.`,
      url: "/gp#a-verifier",
    });
  });
}

/** L'administrateur a retrouvé le paiement : réservation confirmée, contacts dévoilés. */
export function confirmBooking(actor: Actor, id: number): string {
  if (actor.role !== "admin") throw new UserError("Action réservée à l'administrateur.");
  return transaction(() => {
    const b = bookingFor(actor, id);
    if (b.status !== "a_payer" && b.status !== "a_verifier") throw new UserError("Cette réservation n'attend pas de paiement.");
    const now = new Date().toISOString();
    run("UPDATE gp_bookings SET status = 'confirmee', confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ?", actor.id, now, now, id);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: b.gp_id, kind: "gp", message: `Paiement confirmé pour ${b.reference}` });
    notifyUser(actor.companyId, b.sender_id, { title: "Réservation confirmée", body: `Paiement reçu. Vous pouvez contacter votre GP ${b.gp_name} (${b.reference}).`, url: `/gp/reservations/${id}` });
    notifyUser(actor.companyId, b.gp_id, {
      title: "Nouvelle réservation confirmée",
      body: `${formatWeight(b.weight_grams)} de ${b.sender_name} pour votre voyage du ${dayLabel(b.departure_date)}. Ses coordonnées sont disponibles.`,
      url: `/gp/reservations/${id}`,
    });
    return b.reference;
  });
}

/** Paiement introuvable : la réservation repasse « frais à payer » avec un message pour l'expéditeur. */
export function rejectPayment(actor: Actor, id: number, note: string): string {
  if (actor.role !== "admin") throw new UserError("Action réservée à l'administrateur.");
  if (note.length < 3) throw new UserError("Expliquez en quelques mots pourquoi le paiement n'est pas validé.");
  return transaction(() => {
    const b = bookingFor(actor, id);
    if (b.status !== "a_verifier") throw new UserError("Aucun paiement déclaré à vérifier pour cette réservation.");
    run("UPDATE gp_bookings SET status = 'a_payer', admin_note = ?, updated_at = ? WHERE id = ?", note, new Date().toISOString(), id);
    logEvent({ companyId: actor.companyId, userId: actor.id, kind: "gp", message: `Paiement non retrouvé pour ${b.reference} : ${note}` });
    notifyUser(actor.companyId, b.sender_id, { title: "Paiement non retrouvé", body: `${b.reference} : ${note}`, url: `/gp/reservations/${id}` });
    return b.reference;
  });
}

/** Annulation : l'expéditeur tant que rien n'est confirmé ; l'administrateur jusqu'à la livraison. */
export function cancelBooking(actor: Actor, id: number): void {
  transaction(() => {
    const b = bookingFor(actor, id);
    const isSender = actor.role === "merchant" && b.sender_id === actor.id;
    if (!isSender && actor.role !== "admin") throw new UserError("Réservation introuvable.");
    if (b.status === "annulee" || b.status === "livree") throw new UserError("Cette réservation est terminée.");
    if (isSender && b.status === "confirmee") throw new UserError("Réservation confirmée : contactez le GP ou l'administrateur pour l'annuler.");
    const now = new Date().toISOString();
    run("UPDATE gp_bookings SET status = 'annulee', updated_at = ? WHERE id = ?", now, id);
    // Des kilos se libèrent : un voyage complet redevient ouvert.
    run("UPDATE gp_trips SET status = 'ouvert', updated_at = ? WHERE id = ? AND status = 'complet'", now, b.trip_id);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: b.gp_id, kind: "gp", message: `Réservation ${b.reference} annulée` });
    if (b.status === "confirmee")
      notifyUser(actor.companyId, b.gp_id, { title: "Réservation annulée", body: `${b.reference} (${b.sender_name}) a été annulée.`, url: `/gp/voyages/${b.trip_id}` });
  });
}

/** Colis remis au destinataire : le GP, l'expéditeur ou l'administrateur le confirme. */
export function markBookingDelivered(actor: Actor, id: number): void {
  transaction(() => {
    const b = bookingFor(actor, id);
    const allowed = actor.role === "admin" || (actor.role === "gp" && b.gp_id === actor.id) || (actor.role === "merchant" && b.sender_id === actor.id);
    if (!allowed) throw new UserError("Réservation introuvable.");
    if (b.status !== "confirmee") throw new UserError("Seule une réservation confirmée peut être marquée livrée.");
    const now = new Date().toISOString();
    run("UPDATE gp_bookings SET status = 'livree', delivered_at = ?, updated_at = ? WHERE id = ?", now, now, id);
    logEvent({ companyId: actor.companyId, userId: actor.id, subjectUserId: b.gp_id, kind: "gp", message: `Colis ${b.reference} remis au destinataire` });
    if (actor.id !== b.sender_id)
      notifyUser(actor.companyId, b.sender_id, { title: "Colis livré", body: `${b.reference} a été remis à ${b.recipient_name}. Donnez une note à votre GP.`, url: `/gp/reservations/${id}` });
  });
}

/** Note du GP par l'expéditeur, une seule fois, après la livraison. */
export function rateBooking(actor: Actor, id: number, rating: number, comment: string | null): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new UserError("Choisissez une note de 1 à 5 étoiles.");
  if (comment && comment.length > 300) throw new UserError("Commentaire : 300 caractères au maximum.");
  const b = bookingFor(actor, id);
  if (actor.role !== "merchant" || b.sender_id !== actor.id) throw new UserError("Réservation introuvable.");
  if (b.status !== "livree") throw new UserError("Vous pourrez noter le GP une fois le colis livré.");
  const r = run("UPDATE gp_bookings SET rating = ?, rating_comment = ?, updated_at = ? WHERE id = ? AND rating IS NULL", rating, comment, new Date().toISOString(), id);
  if (!r.changes) throw new UserError("Vous avez déjà noté ce GP pour ce colis.");
}

/* ---------- Tableau de bord GP ---------- */

export function gpCounts(actor: Actor): { trips: number; toVerify: number; pendingGps: number } {
  if (actor.role !== "admin") return { trips: 0, toVerify: 0, pendingGps: 0 };
  const c = get<{ trips: number; toVerify: number; pendingGps: number }>(
    `SELECT (SELECT COUNT(*) FROM gp_trips WHERE company_id = ? AND status = 'ouvert') AS trips,
            (SELECT COUNT(*) FROM gp_bookings WHERE company_id = ? AND status = 'a_verifier') AS toVerify,
            (SELECT COUNT(*) FROM users WHERE company_id = ? AND role = 'gp' AND pending = 1) AS pendingGps`,
    actor.companyId,
    actor.companyId,
    actor.companyId,
  );
  return c ?? { trips: 0, toVerify: 0, pendingGps: 0 };
}

/** Le GP a encore des colis confirmés à remettre (bloque la suppression de son compte). */
export function gpOpenCommitments(gpId: number): number {
  return get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM gp_bookings b JOIN gp_trips t ON t.id = b.trip_id WHERE t.gp_id = ? AND b.status = 'confirmee'",
    gpId,
  )!.n;
}

/** Suppression du compte d'un GP : ses voyages encore ouverts sont annulés. */
export function closeTripsOf(gpId: number): void {
  const now = new Date().toISOString();
  run(
    "UPDATE gp_bookings SET status = 'annulee', updated_at = ? WHERE status IN ('a_payer','a_verifier') AND trip_id IN (SELECT id FROM gp_trips WHERE gp_id = ?)",
    now,
    gpId,
  );
  run("UPDATE gp_trips SET status = 'annule', updated_at = ? WHERE gp_id = ? AND status <> 'annule'", now, gpId);
}

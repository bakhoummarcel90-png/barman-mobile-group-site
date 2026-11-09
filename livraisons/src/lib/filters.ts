import { isDeliveryStatus, isPaymentStatus, type DeliveryStatus, type PaymentStatus } from "./constants";
import type { SqlValue } from "./db";
import { addDays, localInputToIso, todayLocal } from "./format";

export const PERIODS = {
  today: "Aujourd'hui",
  "7d": "7 derniers jours et à venir",
  "30d": "30 derniers jours et à venir",
  month: "Depuis le début du mois",
  all: "Toutes les dates",
  custom: "Dates personnalisées",
} as const;
export type Period = keyof typeof PERIODS;

export type StatusFilter = DeliveryStatus | "actives" | "terminees";

export interface DeliveryFilters {
  period: Period;
  from: string; // AAAA-MM-JJ (inclus)
  to: string; // AAAA-MM-JJ (inclus)
  merchantId: number | null;
  courierId: number | null;
  status: StatusFilter | null;
  payment: PaymentStatus | null;
  q: string;
}

type Params = Record<string, string | string[] | undefined>;

function one(p: Params, key: string): string {
  const v = p[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

function positiveInt(v: string): number | null {
  return /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Lit les filtres depuis l'URL (?periode=7d&commercant=2…). */
export function parseFilters(p: Params, timeZone: string, defaultPeriod: Period = "all"): DeliveryFilters {
  const today = todayLocal(timeZone);
  const raw = one(p, "periode");
  let period: Period = raw in PERIODS ? (raw as Period) : defaultPeriod;
  let from = "";
  let to = "";
  switch (period) {
    case "today":
      from = to = today;
      break;
    // Périodes glissantes : sans borne de fin, pour inclure les livraisons déjà planifiées à venir.
    case "7d":
      from = addDays(today, -6);
      break;
    case "30d":
      from = addDays(today, -29);
      break;
    case "month":
      from = `${today.slice(0, 7)}-01`;
      break;
    case "custom": {
      const f = one(p, "du");
      const t = one(p, "au");
      from = DAY.test(f) ? f : "";
      to = DAY.test(t) ? t : "";
      if (from && to && from > to) [from, to] = [to, from];
      if (!from && !to) period = "all";
      break;
    }
  }
  const status = one(p, "statut");
  const payment = one(p, "paiement");
  return {
    period,
    from,
    to,
    merchantId: positiveInt(one(p, "commercant")),
    courierId: positiveInt(one(p, "livreur")),
    status: isDeliveryStatus(status) || status === "actives" || status === "terminees" ? (status as StatusFilter) : null,
    payment: isPaymentStatus(payment) ? payment : null,
    q: one(p, "q").slice(0, 80),
  };
}

/** Conditions SQL correspondant aux filtres (à combiner avec deliveryScope). */
export function filterSql(f: DeliveryFilters, timeZone: string, alias = "d"): { sql: string[]; params: SqlValue[] } {
  const sql: string[] = [];
  const params: SqlValue[] = [];
  const dateCol = `COALESCE(${alias}.scheduled_at, ${alias}.created_at)`;
  if (f.from) {
    sql.push(`${dateCol} >= ?`);
    params.push(localInputToIso(f.from, timeZone)!);
  }
  if (f.to) {
    sql.push(`${dateCol} < ?`);
    params.push(localInputToIso(addDays(f.to, 1), timeZone)!);
  }
  if (f.merchantId) {
    sql.push(`${alias}.merchant_id = ?`);
    params.push(f.merchantId);
  }
  if (f.courierId) {
    sql.push(`${alias}.courier_id = ?`);
    params.push(f.courierId);
  }
  if (f.status === "actives") sql.push(`${alias}.status IN ('a_attribuer','attribuee','en_cours','echec')`);
  else if (f.status === "terminees") sql.push(`${alias}.status IN ('livree','retour_commercant','annulee')`);
  else if (f.status) {
    sql.push(`${alias}.status = ?`);
    params.push(f.status);
  }
  if (f.payment) {
    sql.push(`${alias}.payment_status = ?`);
    params.push(f.payment);
  }
  if (f.q) {
    sql.push(`(${alias}.reference LIKE ? OR ${alias}.customer_name LIKE ? OR ${alias}.customer_phone LIKE ? OR ${alias}.neighborhood LIKE ?)`);
    const like = `%${f.q.replace(/[%_]/g, "")}%`;
    params.push(like, like, like.replace(/\s/g, ""), like);
  }
  return { sql, params };
}

/** Reconstruit la chaîne de requête des filtres (pour les liens et l'export CSV). */
export function filtersToQuery(f: DeliveryFilters, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams();
  if (f.period !== "all") q.set("periode", f.period);
  if (f.period === "custom") {
    if (f.from) q.set("du", f.from);
    if (f.to) q.set("au", f.to);
  }
  if (f.merchantId) q.set("commercant", String(f.merchantId));
  if (f.courierId) q.set("livreur", String(f.courierId));
  if (f.status) q.set("statut", f.status);
  if (f.payment) q.set("paiement", f.payment);
  if (f.q) q.set("q", f.q);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

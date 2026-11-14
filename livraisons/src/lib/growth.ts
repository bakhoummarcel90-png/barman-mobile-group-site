import { addDays, todayLocal } from "./format";
import { all, get } from "./db";
import { getCountry } from "./regions";
import type { Actor } from "./types";

/*
 * Suivi de la croissance (administrateur) : combien de personnes utilisent
 * l'application, semaine après semaine. Sert à décider quand passer
 * d'une période de lancement gratuite à des frais payants.
 */

export interface GrowthTotals {
  merchants: number;
  individuals: number;
  couriers: number;
  gps: number;
  gpTrips: number;
  gpBookings: number;
  deliveries: number;
}

export interface GrowthWeek {
  /** Lundi de la semaine (AAAA-MM-JJ). */
  start: string;
  signups: number;
  gpTrips: number;
  gpBookings: number;
  deliveries: number;
}

/** Lundi de la semaine qui contient « day » (AAAA-MM-JJ). */
export function mondayOf(day: string): string {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = dimanche
  return addDays(day, -((dow + 6) % 7));
}

export function growthStats(actor: Actor, weeks = 8): { totals: GrowthTotals; weeks: GrowthWeek[] } | null {
  if (actor.role !== "admin") return null;
  const c = actor.companyId;
  const n = (sql: string, ...p: (string | number)[]) => get<{ n: number }>(sql, ...p)!.n;
  const totals: GrowthTotals = {
    merchants: n("SELECT COUNT(*) AS n FROM merchants WHERE company_id = ? AND active = 1 AND (notes IS NULL OR notes NOT LIKE 'Particulier%')", c),
    individuals: n("SELECT COUNT(*) AS n FROM merchants WHERE company_id = ? AND active = 1 AND notes LIKE 'Particulier%'", c),
    couriers: n("SELECT COUNT(*) AS n FROM users WHERE company_id = ? AND role = 'courier' AND active = 1", c),
    gps: n("SELECT COUNT(*) AS n FROM users WHERE company_id = ? AND role = 'gp' AND active = 1", c),
    gpTrips: n("SELECT COUNT(*) AS n FROM gp_trips WHERE company_id = ? AND status <> 'annule'", c),
    gpBookings: n("SELECT COUNT(*) AS n FROM gp_bookings WHERE company_id = ? AND status <> 'annulee'", c),
    deliveries: n("SELECT COUNT(*) AS n FROM deliveries WHERE company_id = ? AND status <> 'annulee'", c),
  };
  const thisMonday = mondayOf(todayLocal(getCountry(actor.countryCode).timezone));
  const first = addDays(thisMonday, -7 * (weeks - 1));
  // Une seule requête par table : nombre d'éléments créés par semaine.
  const perWeek = (table: string, extra = "") => {
    const rows = all<{ day: string; n: number }>(
      `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS n FROM ${table} WHERE company_id = ? AND created_at >= ? ${extra} GROUP BY day`,
      c,
      first,
    );
    const out = new Map<string, number>();
    for (const r of rows) {
      const w = mondayOf(r.day);
      out.set(w, (out.get(w) ?? 0) + r.n);
    }
    return out;
  };
  const signups = perWeek("users", "AND role <> 'admin'");
  const trips = perWeek("gp_trips");
  const bookings = perWeek("gp_bookings");
  const deliveries = perWeek("deliveries");
  const list: GrowthWeek[] = [];
  for (let i = 0; i < weeks; i++) {
    const start = addDays(first, 7 * i);
    list.push({ start, signups: signups.get(start) ?? 0, gpTrips: trips.get(start) ?? 0, gpBookings: bookings.get(start) ?? 0, deliveries: deliveries.get(start) ?? 0 });
  }
  return { totals, weeks: list.reverse() };
}

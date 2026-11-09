import type { DeliveryStatus } from "./constants";
import { all, run, type SqlValue } from "./db";
import { deliveryScope } from "./scope";
import type { Actor, EventView } from "./types";

export type EventKind =
  | "created"
  | "edited"
  | "status"
  | "assigned"
  | "payment"
  | "note"
  | "photo"
  | "settlement"
  | "account";

export function logEvent(e: {
  companyId: number;
  userId: number | null;
  kind: EventKind;
  deliveryId?: number | null;
  subjectUserId?: number | null;
  merchantId?: number | null;
  fromStatus?: DeliveryStatus | null;
  toStatus?: DeliveryStatus | null;
  message?: string | null;
}): void {
  run(
    `INSERT INTO events (company_id, user_id, delivery_id, subject_user_id, merchant_id, kind, from_status, to_status, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    e.companyId,
    e.userId,
    e.deliveryId ?? null,
    e.subjectUserId ?? null,
    e.merchantId ?? null,
    e.kind,
    e.fromStatus ?? null,
    e.toStatus ?? null,
    e.message ?? null,
    new Date().toISOString(),
  );
}

const SELECT = `
  SELECT e.id, e.kind, e.from_status, e.to_status, e.message, e.created_at,
         u.name AS user_name, u.role AS user_role,
         e.delivery_id, d.reference AS delivery_reference
    FROM events e
    LEFT JOIN users u ON u.id = e.user_id
    LEFT JOIN deliveries d ON d.id = e.delivery_id`;

/** Historique d'une livraison (l'accès à la livraison doit avoir été vérifié). */
export function deliveryEvents(actor: Actor, deliveryId: number): EventView[] {
  return all<EventView>(`${SELECT} WHERE e.company_id = ? AND e.delivery_id = ? ORDER BY e.id DESC`, actor.companyId, deliveryId);
}

/** Derniers événements visibles par l'utilisateur. */
export function recentEvents(
  actor: Actor,
  opts: { limit?: number; merchantId?: number | null; courierId?: number | null } = {},
): EventView[] {
  const params: SqlValue[] = [];
  let where: string;
  if (actor.role === "admin") {
    where = "e.company_id = ?";
    params.push(actor.companyId);
    if (opts.merchantId) {
      where += " AND (d.merchant_id = ? OR e.merchant_id = ?)";
      params.push(opts.merchantId, opts.merchantId);
    }
    if (opts.courierId) {
      where += " AND (d.courier_id = ? OR e.subject_user_id = ? OR e.user_id = ?)";
      params.push(opts.courierId, opts.courierId, opts.courierId);
    }
  } else {
    // Commerçant / livreur : uniquement les événements liés à leurs livraisons.
    const scope = deliveryScope(actor, "d");
    where = `e.delivery_id IS NOT NULL AND ${scope.sql}`;
    params.push(...scope.params);
  }
  params.push(opts.limit ?? 10);
  return all<EventView>(`${SELECT} WHERE ${where} ORDER BY e.id DESC LIMIT ?`, ...params);
}

/** Activité d'un utilisateur (actions faites par lui, ou le concernant). */
export function userActivity(actor: Actor, userId: number, limit = 30): EventView[] {
  return all<EventView>(
    `${SELECT} WHERE e.company_id = ? AND (e.user_id = ? OR e.subject_user_id = ?) ORDER BY e.id DESC LIMIT ?`,
    actor.companyId,
    userId,
    userId,
    limit,
  );
}

/** Activité liée à un commerçant (ses commandes, son compte). */
export function merchantActivity(actor: Actor, merchantId: number, limit = 30): EventView[] {
  return all<EventView>(
    `${SELECT} WHERE e.company_id = ? AND (e.merchant_id = ? OR d.merchant_id = ?) ORDER BY e.id DESC LIMIT ?`,
    actor.companyId,
    merchantId,
    merchantId,
    limit,
  );
}

import { all, get, run, transaction, type SqlValue } from "./db";
import { logEvent } from "./events";
import { formatMoney } from "./format";
import { getCountry, paymentMethodLabel } from "./regions";
import type { Actor } from "./types";
import { UserError } from "./validation";

/*
 * Règles de rapprochement (version 1, saisie manuelle) :
 *  - Le livreur encaisse auprès du client (espèces, Wave ou Orange Money) puis
 *    REMET ces montants à l'entreprise de livraison : « à remettre par le livreur ».
 *  - L'entreprise REVERSE au commerçant le montant encaissé moins les frais de
 *    livraison, une fois l'encaissement CONFIRMÉ : « à reverser au commerçant ».
 *  - Un montant négatif signifie que les frais dépassent les encaissements
 *    (ex. commandes déjà payées en ligne) : le commerçant doit ces frais.
 */

export interface CourierBalance {
  courier_id: number;
  name: string;
  phone: string | null;
  active: number;
  count: number;
  total: number;
  byMethod: Record<string, number>;
}

export function courierBalances(actor: Actor, courierId?: number | null): CourierBalance[] {
  const params: SqlValue[] = [actor.companyId];
  let extra = "";
  if (actor.role === "courier") courierId = actor.id;
  else if (actor.role !== "admin") return [];
  if (courierId) {
    extra = " AND d.courier_id = ?";
    params.push(courierId);
  }
  const rows = all<{ courier_id: number; name: string; phone: string | null; active: number; method: string | null; n: number; total: number }>(
    `SELECT d.courier_id, u.name, u.phone, u.active, d.collected_payment_method AS method,
            COUNT(*) AS n, SUM(d.collected_amount) AS total
       FROM deliveries d JOIN users u ON u.id = d.courier_id
      WHERE d.company_id = ? AND d.status = 'livree' AND d.collected_amount > 0 AND d.courier_settlement_id IS NULL${extra}
      GROUP BY d.courier_id, d.collected_payment_method
      ORDER BY u.name`,
    ...params,
  );
  const map = new Map<number, CourierBalance>();
  for (const r of rows) {
    const b = map.get(r.courier_id) ?? { courier_id: r.courier_id, name: r.name, phone: r.phone, active: r.active, count: 0, total: 0, byMethod: {} };
    b.count += r.n;
    b.total += r.total;
    b.byMethod[r.method ?? "cash"] = (b.byMethod[r.method ?? "cash"] ?? 0) + r.total;
    map.set(r.courier_id, b);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface MerchantBalance {
  merchant_id: number;
  name: string;
  phone: string | null;
  payout_method: string | null;
  payout_account: string | null;
  confirmed_count: number;
  collected: number;
  fees: number;
  net: number;
  pending_count: number;
  pending_net: number;
}

export function merchantBalances(actor: Actor, merchantId?: number | null): MerchantBalance[] {
  if (actor.role === "merchant") merchantId = actor.merchantId;
  else if (actor.role !== "admin") return [];
  const params: SqlValue[] = [actor.companyId];
  let extra = "";
  if (merchantId) {
    extra = " AND m.id = ?";
    params.push(merchantId);
  }
  return all<MerchantBalance>(
    `SELECT m.id AS merchant_id, m.name, m.phone, m.payout_method, m.payout_account,
            SUM(CASE WHEN d.payment_status = 'confirme' THEN 1 ELSE 0 END) AS confirmed_count,
            COALESCE(SUM(CASE WHEN d.payment_status = 'confirme' THEN d.collected_amount END), 0) AS collected,
            COALESCE(SUM(CASE WHEN d.payment_status = 'confirme' THEN d.delivery_fee END), 0) AS fees,
            COALESCE(SUM(CASE WHEN d.payment_status = 'confirme' THEN d.collected_amount - d.delivery_fee END), 0) AS net,
            SUM(CASE WHEN d.payment_status IN ('a_verifier','ecart') THEN 1 ELSE 0 END) AS pending_count,
            COALESCE(SUM(CASE WHEN d.payment_status IN ('a_verifier','ecart') THEN d.collected_amount - d.delivery_fee END), 0) AS pending_net
       FROM merchants m
       JOIN deliveries d ON d.merchant_id = m.id AND d.status = 'livree' AND d.merchant_settlement_id IS NULL
      WHERE m.company_id = ?${extra}
      GROUP BY m.id
     HAVING confirmed_count > 0 OR pending_count > 0
      ORDER BY net DESC`,
    ...params,
  );
}

export function totalsToSettle(actor: Actor): { couriers: number; merchants: number; pending: number } {
  if (actor.role === "courier") return { couriers: courierBalances(actor).reduce((s, b) => s + b.total, 0), merchants: 0, pending: 0 };
  const mb = merchantBalances(actor);
  return {
    couriers: actor.role === "admin" ? courierBalances(actor).reduce((s, b) => s + b.total, 0) : 0,
    merchants: mb.reduce((s, b) => s + b.net, 0),
    pending: mb.reduce((s, b) => s + b.pending_net, 0),
  };
}

export interface SettlementView {
  id: number;
  kind: "courier_remittance" | "merchant_payout";
  amount: number;
  delivery_count: number;
  method: string | null;
  reference: string | null;
  note: string | null;
  created_at: string;
  courier_name: string | null;
  merchant_name: string | null;
  created_by_name: string;
}

export function listSettlements(actor: Actor, opts: { kind?: SettlementView["kind"]; limit?: number } = {}): SettlementView[] {
  const params: SqlValue[] = [actor.companyId];
  let where = "s.company_id = ?";
  if (actor.role === "merchant") {
    where += " AND s.kind = 'merchant_payout' AND s.merchant_id = ?";
    params.push(actor.merchantId ?? -1);
  } else if (actor.role === "courier") {
    where += " AND s.kind = 'courier_remittance' AND s.courier_id = ?";
    params.push(actor.id);
  } else if (opts.kind) {
    where += " AND s.kind = ?";
    params.push(opts.kind);
  }
  params.push(opts.limit ?? 50);
  return all<SettlementView>(
    `SELECT s.*, c.name AS courier_name, m.name AS merchant_name, u.name AS created_by_name
       FROM settlements s
       LEFT JOIN users c ON c.id = s.courier_id
       LEFT JOIN merchants m ON m.id = s.merchant_id
       JOIN users u ON u.id = s.created_by
      WHERE ${where}
      ORDER BY s.id DESC LIMIT ?`,
    ...params,
  );
}

export interface SettlementInput {
  method: string | null;
  reference: string | null;
  note: string | null;
}

/** Le livreur a remis à l'entreprise tous les montants encaissés non encore remis. */
export function recordCourierRemittance(actor: Actor, courierId: number, input: SettlementInput): { amount: number; count: number } {
  if (actor.role !== "admin") throw new UserError("Action réservée à l'administrateur.");
  const country = getCountry(actor.countryCode);
  return transaction(() => {
    const courier = get<{ name: string }>("SELECT name FROM users WHERE id = ? AND company_id = ? AND role = 'courier'", courierId, actor.companyId);
    if (!courier) throw new UserError("Livreur introuvable.");
    const ids = all<{ id: number; collected_amount: number }>(
      `SELECT id, collected_amount FROM deliveries
        WHERE company_id = ? AND courier_id = ? AND status = 'livree' AND collected_amount > 0 AND courier_settlement_id IS NULL`,
      actor.companyId,
      courierId,
    );
    if (!ids.length) throw new UserError("Ce livreur n'a aucun montant à remettre.");
    const amount = ids.reduce((s, r) => s + r.collected_amount, 0);
    const { id } = run(
      `INSERT INTO settlements (company_id, kind, courier_id, amount, delivery_count, method, reference, note, created_by, created_at)
       VALUES (?, 'courier_remittance', ?, ?, ?, ?, ?, ?, ?, ?)`,
      actor.companyId,
      courierId,
      amount,
      ids.length,
      input.method,
      input.reference,
      input.note,
      actor.id,
      new Date().toISOString(),
    );
    run(
      `UPDATE deliveries SET courier_settlement_id = ? WHERE id IN (${ids.map(() => "?").join(",")})`,
      id,
      ...ids.map((r) => r.id),
    );
    logEvent({
      companyId: actor.companyId,
      userId: actor.id,
      subjectUserId: courierId,
      kind: "settlement",
      message: `Remise de ${courier.name} reçue : ${formatMoney(amount, country)} pour ${ids.length} livraison(s)${input.method ? ` (${paymentMethodLabel(country, input.method)})` : ""}`,
    });
    return { amount, count: ids.length };
  });
}

/** L'entreprise a reversé au commerçant tous les encaissements confirmés non encore reversés. */
export function recordMerchantPayout(actor: Actor, merchantId: number, input: SettlementInput): { amount: number; count: number } {
  if (actor.role !== "admin") throw new UserError("Action réservée à l'administrateur.");
  const country = getCountry(actor.countryCode);
  return transaction(() => {
    const merchant = get<{ name: string }>("SELECT name FROM merchants WHERE id = ? AND company_id = ?", merchantId, actor.companyId);
    if (!merchant) throw new UserError("Commerçant introuvable.");
    const rows = all<{ id: number; net: number }>(
      `SELECT id, collected_amount - delivery_fee AS net FROM deliveries
        WHERE company_id = ? AND merchant_id = ? AND status = 'livree' AND payment_status = 'confirme' AND merchant_settlement_id IS NULL`,
      actor.companyId,
      merchantId,
    );
    if (!rows.length) throw new UserError("Aucun encaissement confirmé à reverser pour ce commerçant.");
    const amount = rows.reduce((s, r) => s + r.net, 0);
    const { id } = run(
      `INSERT INTO settlements (company_id, kind, merchant_id, amount, delivery_count, method, reference, note, created_by, created_at)
       VALUES (?, 'merchant_payout', ?, ?, ?, ?, ?, ?, ?, ?)`,
      actor.companyId,
      merchantId,
      amount,
      rows.length,
      input.method,
      input.reference,
      input.note,
      actor.id,
      new Date().toISOString(),
    );
    run(
      `UPDATE deliveries SET merchant_settlement_id = ? WHERE id IN (${rows.map(() => "?").join(",")})`,
      id,
      ...rows.map((r) => r.id),
    );
    logEvent({
      companyId: actor.companyId,
      userId: actor.id,
      merchantId,
      kind: "settlement",
      message: `Reversement à ${merchant.name} : ${formatMoney(amount, country)} pour ${rows.length} livraison(s)${input.method ? ` (${paymentMethodLabel(country, input.method)})` : ""}`,
    });
    return { amount, count: rows.length };
  });
}

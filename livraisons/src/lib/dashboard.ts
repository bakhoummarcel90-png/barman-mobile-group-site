import { DELIVERY_STATUSES, type DeliveryStatus } from "./constants";
import { all, get } from "./db";
import { filterSql, type DeliveryFilters } from "./filters";
import { courierBalances, merchantBalances } from "./finance";
import { getCountry } from "./regions";
import { shipmentCounts } from "./shipments";
import { deliveryScope } from "./scope";
import type { Actor } from "./types";

export interface DashboardAction {
  label: string;
  detail: string;
  count: number;
  href: string;
  tone: "warning" | "danger" | "info";
}

export interface DashboardData {
  counts: Record<DeliveryStatus, number>;
  total: number;
  collected: number;
  fees: number;
  toMerchants: number;
  heldByCouriers: number;
  pendingVerification: number;
  actions: DashboardAction[];
}

export function dashboardData(actor: Actor, filters: DeliveryFilters): DashboardData {
  const tz = getCountry(actor.countryCode).timezone;
  const scope = deliveryScope(actor);
  // Les compteurs ignorent le filtre de statut (ils détaillent justement chaque statut).
  const f = filterSql({ ...filters, status: null }, tz);
  const where = [scope.sql, ...f.sql].join(" AND ");
  const params = [...scope.params, ...f.params];

  const counts = Object.fromEntries(DELIVERY_STATUSES.map((s) => [s, 0])) as Record<DeliveryStatus, number>;
  for (const r of all<{ status: DeliveryStatus; n: number }>(
    `SELECT d.status, COUNT(*) AS n FROM deliveries d WHERE ${where} GROUP BY d.status`,
    ...params,
  ))
    counts[r.status] = r.n;

  const money = get<{ collected: number; fees: number }>(
    `SELECT COALESCE(SUM(d.collected_amount),0) AS collected, COALESCE(SUM(d.delivery_fee),0) AS fees
       FROM deliveries d WHERE ${where} AND d.status = 'livree'`,
    ...params,
  )!;

  const merchants = actor.role === "courier" ? [] : merchantBalances(actor, filters.merchantId);
  const couriers = actor.role === "merchant" ? [] : courierBalances(actor, filters.courierId);

  return {
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    collected: money.collected,
    fees: money.fees,
    toMerchants: merchants.reduce((s, b) => s + b.net, 0),
    pendingVerification: merchants.reduce((s, b) => s + b.pending_net, 0),
    heldByCouriers: couriers.reduce((s, b) => s + b.total, 0),
    actions: actionsFor(actor),
  };
}

/** Points d'attention, indépendants des filtres (ce qu'il faut traiter maintenant). */
function actionsFor(actor: Actor): DashboardAction[] {
  const scope = deliveryScope(actor);
  const count = (cond: string, ...extra: (string | number)[]) =>
    get<{ n: number }>(`SELECT COUNT(*) AS n FROM deliveries d WHERE ${scope.sql} AND ${cond}`, ...scope.params, ...extra)!.n;
  const now = new Date().toISOString();
  const out: DashboardAction[] = [];

  if (actor.role === "admin") {
    const applicants = get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE company_id = ? AND role = 'courier' AND pending = 1", actor.companyId)!.n;
    if (applicants)
      out.push({ label: "Livreurs à valider", detail: "Inscriptions reçues depuis la page d'inscription", count: applicants, href: "/livreurs#a-valider", tone: "warning" });
    const gp = get<{ pending: number; toVerify: number }>(
      `SELECT (SELECT COUNT(*) FROM users WHERE company_id = ? AND role = 'gp' AND pending = 1) AS pending,
              (SELECT COUNT(*) FROM gp_bookings WHERE company_id = ? AND status = 'a_verifier') AS toVerify`,
      actor.companyId,
      actor.companyId,
    )!;
    if (gp.pending) out.push({ label: "GP à valider", detail: "Vérifiez leur identité avant d'accepter", count: gp.pending, href: "/gp#gp-a-valider", tone: "warning" });
    if (gp.toVerify)
      out.push({ label: "Paiements GP à vérifier", detail: "Frais de mise en relation déclarés par les expéditeurs", count: gp.toVerify, href: "/gp#a-verifier", tone: "warning" });
    const merchantsToCheck = get<{ n: number }>("SELECT COUNT(*) AS n FROM merchants WHERE company_id = ? AND review_pending = 1", actor.companyId)!.n;
    if (merchantsToCheck)
      out.push({ label: "Nouveaux commerçants à vérifier", detail: "Inscrits eux-mêmes, comptes déjà actifs", count: merchantsToCheck, href: "/commercants#a-verifier", tone: "warning" });
    const toAssign = count("d.status = 'a_attribuer'");
    if (toAssign)
      out.push({ label: "Commandes à attribuer", detail: "Choisissez un livreur", count: toAssign, href: "/livraisons#a-attribuer", tone: "warning" });
    const late = count("d.status IN ('a_attribuer','attribuee') AND d.scheduled_at IS NOT NULL AND d.scheduled_at < ?", now);
    if (late)
      out.push({ label: "Livraisons en retard", detail: "Heure prévue dépassée, course non démarrée", count: late, href: "/livraisons#en-retard", tone: "danger" });
    const failed = count("d.status = 'echec'");
    if (failed)
      out.push({ label: "Échecs à traiter", detail: "Nouvelle tentative ou retour au commerçant", count: failed, href: "/commandes?statut=echec", tone: "danger" });
    const toVerify = count("d.payment_status = 'a_verifier'");
    if (toVerify)
      out.push({ label: "Encaissements à vérifier", detail: "Confirmez les montants saisis par les livreurs", count: toVerify, href: "/encaissements#a-verifier", tone: "warning" });
    const gaps = count("d.payment_status = 'ecart'");
    if (gaps) out.push({ label: "Écarts constatés", detail: "Montant collecté différent du montant attendu", count: gaps, href: "/encaissements#a-verifier", tone: "danger" });
    const holders = courierBalances(actor).length;
    if (holders)
      out.push({ label: "Livreurs avec de l'argent à remettre", detail: "Enregistrez les remises à la caisse", count: holders, href: "/encaissements#livreurs", tone: "info" });
    const colis = shipmentCounts(actor);
    if (colis.arrived)
      out.push({ label: "Colis internationaux arrivés", detail: "Organisez la livraison au destinataire", count: colis.arrived, href: "/colis?statut=actifs&sens=import", tone: "warning" });
    const payees = merchantBalances(actor).filter((m) => m.net !== 0).length;
    if (payees) out.push({ label: "Commerçants à payer", detail: "Encaissements confirmés à reverser", count: payees, href: "/encaissements#commercants", tone: "info" });
  } else if (actor.role === "merchant") {
    const failed = count("d.status = 'echec'");
    if (failed)
      out.push({ label: "Livraisons en échec", detail: "Le livreur n'a pas pu livrer : un retour ou une nouvelle tentative est prévu", count: failed, href: "/commandes?statut=echec", tone: "danger" });
    const waiting = count("d.status = 'a_attribuer'");
    if (waiting) out.push({ label: "En attente d'un livreur", detail: "L'entreprise de livraison va attribuer ces commandes", count: waiting, href: "/commandes?statut=a_attribuer", tone: "info" });
    const colis = shipmentCounts(actor);
    if (colis.active) out.push({ label: "Colis internationaux en cours", detail: "Suivez leurs étapes", count: colis.active, href: "/colis?statut=actifs", tone: "info" });
    const gaps = count("d.payment_status = 'ecart'");
    if (gaps) out.push({ label: "Écarts d'encaissement", detail: "Montant collecté différent du prix de la commande", count: gaps, href: "/encaissements", tone: "warning" });
  }
  return out;
}

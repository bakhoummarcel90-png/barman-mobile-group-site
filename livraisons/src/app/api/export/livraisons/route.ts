import { getCurrentUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { PAYMENT_STATUS_LABELS, STATUS_LABELS } from "@/lib/constants";
import { csvResponse, toCsv } from "@/lib/csv";
import { listDeliveries } from "@/lib/deliveries";
import { parseFilters } from "@/lib/filters";
import { isoToLocalInput, plainAmount, todayLocal } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/regions";

/** Export CSV des livraisons (mêmes filtres que la page Commandes, même périmètre d'accès). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "courier") return new Response("Accès refusé", { status: 403 });
  const country = countryOf(user);
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const filters = parseFilters(sp, country.timezone);
  const { rows } = listDeliveries(user, filters, { limit: 20000 });
  const dt = (iso: string | null) => (iso ? isoToLocalInput(iso, country.timezone).replace("T", " ") : "");

  const csv = toCsv(
    [
      "N° commande", "Commerçant", "Livreur", "Client", "Téléphone client", "Quartier", "Adresse",
      "Date prévue", "Statut", "Raison échec", `Montant attendu (${country.currencyLabel})`, "Paiement attendu",
      `Frais de livraison (${country.currencyLabel})`, `Montant collecté (${country.currencyLabel})`, "Payé par",
      "Statut paiement", "Confirmé par", "Confirmé le", `Net commerçant (${country.currencyLabel})`,
      "Remis par le livreur", "Reversé au commerçant", "Livré le", "Créé le",
    ],
    rows.map((d) => [
      d.reference, d.merchant_name, d.courier_name, d.customer_name, d.customer_phone, d.neighborhood, d.address,
      dt(d.scheduled_at), STATUS_LABELS[d.status], d.failure_reason, plainAmount(d.amount_to_collect),
      paymentMethodLabel(country, d.expected_payment_method), plainAmount(d.delivery_fee), plainAmount(d.collected_amount),
      d.collected_payment_method ? paymentMethodLabel(country, d.collected_payment_method) : "",
      d.status === "livree" ? PAYMENT_STATUS_LABELS[d.payment_status] : "", d.confirmed_by_name, dt(d.payment_confirmed_at),
      d.collected_amount === null ? "" : plainAmount(d.collected_amount - d.delivery_fee),
      d.courier_settlement_id ? "Oui" : "Non", d.merchant_settlement_id ? "Oui" : "Non",
      d.status === "livree" ? dt(d.completed_at) : "", dt(d.created_at),
    ]),
  );
  return csvResponse(`livraisons-${todayLocal(country.timezone)}.csv`, csv);
}

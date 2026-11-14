import { getCurrentUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { SHIPMENT_STATUS_LABELS, TRANSPORT_MODES } from "@/lib/constants";
import { csvResponse, toCsv } from "@/lib/csv";
import { isoToLocalInput, todayLocal } from "@/lib/format";
import { shippingCountryName } from "@/lib/regions";
import { DIRECTION_LABELS, directionOf, listShipments, parseShipmentFilters } from "@/lib/shipments";

/** Export CSV des colis internationaux (mêmes filtres et même périmètre que la page Colis). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "merchant")) return new Response("Accès refusé", { status: 403 });
  const country = countryOf(user);
  const f = parseShipmentFilters(Object.fromEntries(new URL(req.url).searchParams));
  const { rows } = listShipments(user, f, { limit: 20000 });
  const csv = toCsv(
    [
      "N° de suivi", "Sens", "Étape", "Pays de départ", "Ville de départ", "Pays d'arrivée", "Ville d'arrivée", "Transport",
      "Transporteur", "N° transporteur", "Client", "Expéditeur", "Destinataire", "Téléphone destinataire", "Contenu", "Colis",
      "Poids (kg)", "Valeur déclarée", "Devise", `Frais d'envoi (${country.currencyLabel})`, "Frais payés", "Arrivée estimée",
      "Livraison locale", "Créé le",
    ],
    rows.map((s) => [
      s.tracking_number, DIRECTION_LABELS[directionOf(s, country.code)], SHIPMENT_STATUS_LABELS[s.status],
      shippingCountryName(s.origin_country), s.origin_city, shippingCountryName(s.destination_country), s.destination_city,
      TRANSPORT_MODES[s.transport_mode] ?? s.transport_mode, s.carrier, s.carrier_tracking, s.merchant_name ?? "Particulier",
      s.sender_name, s.recipient_name, s.recipient_phone, s.description, s.pieces,
      s.weight_grams === null ? "" : String(s.weight_grams / 1000).replace(".", ","), s.declared_value, s.declared_currency,
      s.shipping_fee, s.fee_paid ? "Oui" : "Non", s.estimated_arrival, s.delivery_reference,
      isoToLocalInput(s.created_at, country.timezone).replace("T", " "),
    ]),
  );
  return csvResponse(`colis-${todayLocal(country.timezone)}.csv`, csv);
}

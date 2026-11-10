import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil, Truck } from "lucide-react";
import { ContactButtons } from "@/components/ContactButtons";
import { ShipmentStatusForm } from "@/components/ShipmentForms";
import { Alert, Card, DefinitionList, PageHeader, ShipmentBadge, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { SHIPMENT_FINAL, SHIPMENT_STATUS_LABELS, TRANSPORT_MODES, isDeliveryStatus } from "@/lib/constants";
import { formatDate, formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import { shippingCountryName } from "@/lib/regions";
import {
  canEditShipment,
  carrierTrackingUrl,
  DIRECTION_LABELS,
  directionOf,
  formatWeight,
  getShipment,
  shipmentEvents,
  trackingPath,
} from "@/lib/shipments";

export const metadata: Metadata = { title: "Colis" };

const OK: Record<string, string> = {
  cree: "Colis enregistré. Transmettez le numéro de suivi à votre client.",
  modifie: "Modifications enregistrées.",
  etape: "Étape de suivi enregistrée : elle est visible sur la page de suivi du client.",
};

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function ShipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser(["admin", "merchant"]);
  const country = countryOf(user);
  const s = getShipment(user, Number((await params).id));
  if (!s) notFound();
  const ok = (await searchParams).ok;
  const events = shipmentEvents(user, s.id);
  const isAdmin = user.role === "admin";
  const trackingUrl = `${await siteOrigin()}${trackingPath(s.tracking_number, s.merchant_name)}`;
  const carrierUrl = carrierTrackingUrl(s.carrier, s.carrier_tracking);
  const direction = directionOf(s, country.code);
  const final = SHIPMENT_FINAL.includes(s.status);
  const hasActiveDelivery = !!s.delivery_id && s.delivery_status !== "annulee" && s.delivery_status !== "retour_commercant";
  const canCreateDelivery = isAdmin && !final && direction === "import" && !hasActiveDelivery && ["arrive_destination", "douane", "pret", "incident"].includes(s.status);
  const shareText = `Bonjour ${s.recipient_name}, votre colis (${s.description}) en provenance de ${shippingCountryName(s.origin_country)} est enregistré${s.merchant_name ? ` par ${s.merchant_name}` : ""} chez ${user.companyName}. Suivez-le ici : ${trackingUrl} (n° ${s.tracking_number}).`;

  return (
    <>
      <PageHeader
        title={s.tracking_number}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <ShipmentBadge status={s.status} />
            <span>
              {DIRECTION_LABELS[direction]} · enregistré le {formatDateTime(s.created_at, country)}
            </span>
          </span>
        }
        back={{ href: "/colis", label: "Colis" }}
        actions={
          canEditShipment(user, s) ? (
            <Link href={`/colis/${s.id}/modifier`} className="btn-secondary">
              <Pencil className="h-4 w-4" aria-hidden /> Modifier
            </Link>
          ) : null
        }
      />
      {ok && OK[ok] ? (
        <div className="mb-4">
          <Alert tone="success">{OK[ok]}</Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card title="Trajet">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
              <span>{[s.origin_city, shippingCountryName(s.origin_country)].filter(Boolean).join(", ")}</span>
              <span className="text-ink-muted">→</span>
              <span>{[s.destination_city, shippingCountryName(s.destination_country)].filter(Boolean).join(", ")}</span>
            </div>
            <DefinitionList
              items={[
                ["Mode de transport", TRANSPORT_MODES[s.transport_mode] ?? s.transport_mode],
                ["Arrivée estimée", s.estimated_arrival ? formatDate(`${s.estimated_arrival}T12:00:00Z`, country) : "Non précisée"],
                ["Transporteur / transitaire", s.carrier],
                [
                  "N° du transporteur",
                  s.carrier_tracking ? (
                    carrierUrl ? (
                      <a href={carrierUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                        {s.carrier_tracking} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    ) : (
                      s.carrier_tracking
                    )
                  ) : null,
                ],
              ]}
            />
            {s.carrier_tracking && !carrierUrl ? (
              <p className="mt-3 text-xs text-ink-muted">Suivi chez le transporteur : consultez son site avec ce numéro (aucune connexion automatique).</p>
            ) : null}
          </Card>

          <Card title="Expéditeur et destinataire">
            <DefinitionList
              items={[
                ["Expéditeur", s.sender_name],
                ["Téléphone expéditeur", s.sender_phone ? formatPhone(s.sender_phone, country) : null],
                ["Destinataire", s.recipient_name],
                ["Téléphone destinataire", formatPhone(s.recipient_phone, country)],
                ["Adresse de livraison", s.recipient_address],
                ...(isAdmin ? ([["Client commerçant", s.merchant_name ?? "Particulier"]] as [string, string][]) : []),
                ["Référence client", s.client_reference],
              ]}
            />
          </Card>

          <Card title="Contenu et tarif">
            <DefinitionList
              items={[
                ["Contenu", s.description],
                ["Nombre de colis", String(s.pieces)],
                ["Poids", formatWeight(s.weight_grams)],
                ["Valeur déclarée", s.declared_value !== null ? `${s.declared_value.toLocaleString("fr-FR")} ${s.declared_currency ?? ""}` : null],
                ["Frais d'envoi", formatMoney(s.shipping_fee, country)],
                ["Paiement des frais", s.fee_paid ? "Payés" : "À payer à la livraison"],
                ["Notes internes", s.notes],
              ]}
            />
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card title="Suivi pour le client">
            <p className="text-sm text-ink-soft">Le client suit son colis sur cette page, sans compte :</p>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="link mt-1 block break-all text-sm">
              {trackingUrl}
            </a>
            <p className="mt-3 mb-1 text-xs text-ink-muted">Envoyer le lien au destinataire :</p>
            <ContactButtons phone={s.recipient_phone} message={shareText} />
          </Card>

          {isAdmin ? (
            <Card title="Livraison locale">
              {s.delivery_id ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/commandes/${s.delivery_id}`} className="link">
                    {s.delivery_reference}
                  </Link>
                  {s.delivery_status && isDeliveryStatus(s.delivery_status) ? <StatusBadge status={s.delivery_status} /> : null}
                </div>
              ) : null}
              {canCreateDelivery ? (
                <Link href={`/commandes/nouvelle?colis=${s.id}`} className="btn-primary mt-3 w-full">
                  <Truck className="h-4 w-4" aria-hidden /> Créer la livraison au destinataire
                </Link>
              ) : !s.delivery_id ? (
                <p className="text-sm text-ink-muted">
                  {direction !== "import"
                    ? "Colis au départ : la remise se fait chez le transporteur ou le transitaire."
                    : "Disponible quand le colis est arrivé dans le pays."}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-ink-muted">Quand la livraison locale est confirmée par le livreur, le colis passe automatiquement à « Livré ».</p>
            </Card>
          ) : null}

          {isAdmin && !final ? (
            <Card title="Mettre à jour le suivi">
              <ShipmentStatusForm id={s.id} current={s.status} />
            </Card>
          ) : null}

          <Card title="Étapes">
            <ol className="relative space-y-4 border-l border-slate-200 pl-5">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500 ring-1 ring-brand-200" aria-hidden />
                  <p className="text-sm font-semibold text-ink">{SHIPMENT_STATUS_LABELS[e.status]}</p>
                  {e.location ? <p className="text-sm text-ink-soft">{e.location}</p> : null}
                  {e.note ? <p className="text-sm italic text-ink-muted">Note interne : {e.note}</p> : null}
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(e.created_at, country)}
                    {e.user_name ? ` · ${e.user_name}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

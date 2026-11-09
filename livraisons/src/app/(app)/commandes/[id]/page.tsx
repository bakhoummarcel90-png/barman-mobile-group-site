import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Pencil, Phone } from "lucide-react";
import { ContactButtons } from "@/components/ContactButtons";
import { AssignForm, CancelForm, CourierActions, NoteForm, PaymentReviewForm } from "@/components/DeliveryActions";
import { Timeline } from "@/components/Timeline";
import { Alert, Card, DefinitionList, PageHeader, PaymentBadge, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { canTransition } from "@/lib/constants";
import { canEdit, getDelivery } from "@/lib/deliveries";
import { deliveryEvents } from "@/lib/events";
import { formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import { msgCantFind, msgOnTheWay, msgScheduled, msgToCourier, msgToMerchant, whatsappLink } from "@/lib/messages";
import { courierOptions } from "@/lib/people";
import { paymentMethodLabel } from "@/lib/regions";

export const metadata: Metadata = { title: "Livraison" };

const OK_MESSAGES: Record<string, string> = {
  creee: "Commande créée.",
  modifiee: "Modifications enregistrées.",
  en_cours: "Course démarrée. Bonne route !",
  livree: "Livraison confirmée. L'encaissement sera vérifié par l'entreprise de livraison.",
  echec: "Échec enregistré. Le colis doit être rapporté au commerçant, sauf nouvelle tentative.",
  retour_commercant: "Retour au commerçant enregistré.",
  annulee: "Commande annulée.",
};

export default async function DeliveryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const country = countryOf(user);
  const id = Number((await params).id);
  const d = Number.isInteger(id) ? getDelivery(user, id) : null;
  if (!d) notFound();
  const ok = (await searchParams).ok;
  const events = deliveryEvents(user, d.id);
  const role = user.role;
  const isAdmin = role === "admin";
  const settled = !!(d.courier_settlement_id || d.merchant_settlement_id);
  const actionData = {
    id: d.id,
    status: d.status,
    courier_id: d.courier_id,
    amount_to_collect: d.amount_to_collect,
    expected_payment_method: d.expected_payment_method,
    collected_amount: d.collected_amount,
    collected_payment_method: d.collected_payment_method,
    payment_status: d.payment_status,
    payment_note: d.payment_note,
    settled,
  };
  const showCourierActions =
    (role === "courier" || isAdmin) &&
    ((d.status === "attribuee" && canTransition(d.status, "en_cours", role)) || d.status === "en_cours" || d.status === "echec");
  const canCancel = canTransition(d.status, "annulee", role);
  const canAssign = isAdmin && ["a_attribuer", "attribuee", "echec"].includes(d.status);
  const customerMessage = role === "courier" ? msgOnTheWay(d, user.name, country) : msgScheduled(d, user.companyName, country);

  const courierActions = showCourierActions ? (
    <Card title={role === "courier" ? "Ma course" : "Mettre à jour la course"}>
      <CourierActions
        d={actionData}
        role={role}
        paymentMethods={country.paymentMethods}
        currencyLabel={country.currencyLabel}
        amountLabel={`${formatMoney(d.amount_to_collect, country)} (${paymentMethodLabel(country, d.expected_payment_method)})`}
      />
    </Card>
  ) : null;

  return (
    <>
      <PageHeader
        title={d.reference}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={d.status} />
            <span>
              {d.merchant_name} · créée le {formatDateTime(d.created_at, country)}
            </span>
          </span>
        }
        back={role === "courier" ? { href: "/livraisons", label: "Mes livraisons" } : { href: "/commandes", label: "Commandes" }}
        actions={
          canEdit(user, d) ? (
            <Link href={`/commandes/${d.id}/modifier`} className="btn-secondary">
              <Pencil className="h-4 w-4" aria-hidden /> Modifier
            </Link>
          ) : null
        }
      />

      {ok && OK_MESSAGES[ok] ? (
        <div className="mb-4">
          <Alert tone="success">{OK_MESSAGES[ok]}</Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card title="Client">
            <p className="text-lg font-semibold text-ink">{d.customer_name}</p>
            <a href={`tel:${d.customer_phone}`} className="mt-0.5 inline-flex items-center gap-1.5 text-base font-medium text-brand-700">
              <Phone className="h-4 w-4" aria-hidden /> {formatPhone(d.customer_phone, country)}
            </a>
            <p className="mt-3 flex items-start gap-2 text-ink">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
              <span>
                <strong>{d.neighborhood}</strong>
                <br />
                {d.address}
              </span>
            </p>
            {d.access_notes ? (
              <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span className="font-semibold">Accès : </span>
                {d.access_notes}
              </div>
            ) : null}
            {d.status !== "annulee" ? (
              <div className="mt-4">
                <ContactButtons
                  phone={d.customer_phone}
                  message={customerMessage}
                  delivery={d}
                  size={role === "courier" ? "large" : "normal"}
                  showMap={role !== "merchant"}
                  city={country.city}
                />
                {role === "courier" && d.status === "en_cours" ? (
                  <a href={whatsappLink(d.customer_phone, msgCantFind(d, user.name))} target="_blank" rel="noopener noreferrer" className="link mt-2 inline-flex items-center gap-1 text-sm">
                    <MessageCircle className="h-4 w-4" aria-hidden /> Message « je ne trouve pas l'adresse »
                  </a>
                ) : null}
                <p className="mt-2 text-xs text-ink-muted">Ces boutons ouvrent l'application du téléphone avec un message prérempli : rien n'est envoyé automatiquement.</p>
              </div>
            ) : null}
          </Card>

          {courierActions}

          <Card title="Paiement" actions={d.status === "livree" ? <PaymentBadge status={d.payment_status} /> : null}>
            <DefinitionList
              items={[
                ["Montant à collecter", <strong key="a">{formatMoney(d.amount_to_collect, country)}</strong>],
                ["Mode attendu", paymentMethodLabel(country, d.expected_payment_method)],
                ["Frais de livraison", formatMoney(d.delivery_fee, country)],
                ["Montant collecté", d.collected_amount === null ? "Pas encore livré" : formatMoney(d.collected_amount, country)],
                ["Payé par", paymentMethodLabel(country, d.collected_payment_method)],
                [
                  "Confirmé par",
                  d.payment_confirmed_at ? `${d.confirmed_by_name ?? "—"} · ${formatDateTime(d.payment_confirmed_at, country)}` : "Pas encore confirmé",
                ],
                ...(role !== "courier"
                  ? ([["Net pour le commerçant", d.collected_amount === null ? "—" : formatMoney(d.collected_amount - d.delivery_fee, country)]] as [string, string][])
                  : []),
                ["Reversement", d.merchant_settlement_id ? "Reversé au commerçant" : d.courier_settlement_id ? "Remis par le livreur, pas encore reversé" : "Non"],
              ]}
            />
            {d.payment_note ? (
              <div className="mt-3">
                <Alert tone={d.payment_status === "ecart" ? "danger" : "info"}>{d.payment_note}</Alert>
              </div>
            ) : null}
            {isAdmin && d.status === "livree" ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <h3 className="mb-2 text-sm font-semibold text-ink">Vérifier l'encaissement</h3>
                <PaymentReviewForm d={actionData} paymentMethods={country.paymentMethods} currencyLabel={country.currencyLabel} />
              </div>
            ) : null}
          </Card>

          <Card title="Détails">
            <DefinitionList
              items={[
                ["Date prévue", d.scheduled_at ? formatDateTime(d.scheduled_at, country) : "Non précisée"],
                ...(d.shipment_id && role !== "courier"
                  ? ([
                      [
                        "Colis international",
                        <Link key="colis" href={`/colis/${d.shipment_id}`} className="link">
                          Voir le suivi du colis
                        </Link>,
                      ],
                    ] as [string, React.ReactNode][])
                  : []),
                ["Commerçant", d.merchant_name],
                ["Livreur", d.courier_name ?? "Non attribué"],
                ["Départ", formatDateTime(d.started_at, country)],
                ["Fin de course", formatDateTime(d.completed_at, country)],
                ["Raison de l'échec", d.failure_reason],
                ["Notes de la commande", d.notes],
                ["Notes du livreur", d.courier_note ? <span className="whitespace-pre-line">{d.courier_note}</span> : null],
              ]}
            />
            {d.proof_photo ? (
              <div className="mt-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">Photo de preuve</p>
                <a href={`/api/photos/${d.id}`} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/photos/${d.id}`} alt={`Preuve de livraison ${d.reference}`} className="max-h-72 rounded-xl border border-slate-200" />
                </a>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          {canAssign ? (
            <Card title={d.status === "echec" ? "Nouvelle tentative" : "Livreur"}>
              <AssignForm d={actionData} couriers={courierOptions(user)} />
              {d.courier_phone && d.status !== "echec" ? (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-ink-muted">Envoyer les détails de la course à {d.courier_name} :</p>
                  <ContactButtons phone={d.courier_phone} message={msgToCourier(d, country)} />
                </div>
              ) : null}
            </Card>
          ) : null}

          {isAdmin && d.merchant_phone && ["livree", "echec", "retour_commercant"].includes(d.status) ? (
            <Card title="Prévenir le commerçant">
              <ContactButtons phone={d.merchant_phone} message={msgToMerchant(d, country)} />
            </Card>
          ) : null}

          {role === "merchant" && d.courier_phone && ["attribuee", "en_cours"].includes(d.status) ? (
            <Card title="Livreur">
              <p className="font-semibold text-ink">{d.courier_name}</p>
              <a href={`tel:${d.courier_phone}`} className="btn-secondary btn-sm mt-2">
                <Phone className="h-4 w-4" aria-hidden /> {formatPhone(d.courier_phone, country)}
              </a>
            </Card>
          ) : null}

          {canCancel ? (
            <Card title="Annulation">
              <CancelForm d={actionData} />
            </Card>
          ) : null}

          <Card title="Historique">
            <Timeline events={events} country={country} />
          </Card>

          {role !== "merchant" && d.status !== "annulee" ? (
            <Card title="Ajouter une note ou une photo">
              <NoteForm d={actionData} />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

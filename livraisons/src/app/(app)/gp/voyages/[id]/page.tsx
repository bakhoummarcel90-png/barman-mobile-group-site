import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { ContactButtons } from "@/components/ContactButtons";
import { BookingBadge, formatDay, Rating, TripBadge } from "@/components/GpTripCard";
import { BookingForm, TripStatusButtons } from "@/components/GpForms";
import { Alert, Card, DefinitionList, OkBanner, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { formatMoney, formatPhone, todayLocal } from "@/lib/format";
import * as gp from "@/lib/gp";
import { shippingCountryName } from "@/lib/regions";

export const metadata: Metadata = { title: "Voyage GP" };
export const dynamic = "force-dynamic";

const OK = {
  publie: "Voyage publié : il apparaît maintenant dans les recherches des expéditeurs.",
  modifie: "Modifications enregistrées.",
};

export default async function TripPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser(["gp", "admin", "merchant"]);
  const t = gp.getTrip(user, Number((await params).id));
  if (!t) notFound();
  const { ok } = await searchParams;
  const country = countryOf(user);
  const manage = gp.canManageTrip(user, t);
  const left = gp.remainingGrams(t);
  const today = todayLocal(country.timezone);
  const bookable = user.role === "merchant" && t.status === "ouvert" && t.departure_date >= today && left > 0 && !(t.deadline_date && t.deadline_date < today);
  const { fee } = gp.gpSettings(user.companyId);
  const bookings = manage ? gp.tripBookings(user, t.id) : gp.myBookings(user).filter((b) => b.trip_id === t.id);

  return (
    <>
      <PageHeader
        title={`${t.origin_city} → ${t.destination_city}`}
        description={`${shippingCountryName(t.origin_country)} → ${shippingCountryName(t.destination_country)} · départ ${formatDay(t.departure_date)}`}
        back={{ href: "/gp", label: manage && user.role === "gp" ? "Mes voyages" : "Voyages GP" }}
        actions={
          manage && t.status !== "annule" ? (
            <Link href={`/gp/voyages/${t.id}/modifier`} className="btn-secondary">
              <Pencil className="h-4 w-4" aria-hidden /> Modifier
            </Link>
          ) : null
        }
      />
      <OkBanner code={ok} messages={OK} />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card title="Le voyage" actions={<TripBadge status={t.status} />}>
          <DefinitionList
            items={[
              ["GP", manage ? t.gp_name : <span key="gp" className="inline-flex flex-wrap items-center gap-2">{gp.publicName(t.gp_name)} <Rating avg={t.rating_avg} count={t.rating_count} /></span>],
              ["Départ", `${formatDay(t.departure_date)} · ${t.origin_city}`],
              ["Arrivée", `${t.arrival_date ? `${formatDay(t.arrival_date)} · ` : ""}${t.destination_city}`],
              ["Prix", gp.pricePerKgLabel(t)],
              ["Kilos", manage ? `${gp.formatWeight(t.reserved_grams)} réservés sur ${gp.formatWeight(t.capacity_grams)}` : `${gp.formatWeight(left)} disponibles`],
              ["Dernier jour de dépôt", t.deadline_date ? formatDay(t.deadline_date) : "—"],
              ["Lieu de dépôt", manage || bookings.some(gp.contactsVisible) ? t.dropoff_place ?? "—" : "Communiqué après confirmation de votre réservation"],
              ...(t.notes ? ([["Informations", t.notes]] as [string, string][]) : []),
            ]}
          />
          {manage ? (
            <div className="mt-4">
              <TripStatusButtons id={t.id} status={t.status} />
            </div>
          ) : null}
        </Card>

        {manage ? (
          <Card title={`Réservations (${bookings.filter((b) => b.status !== "annulee").length})`}>
            {bookings.length ? (
              <ul className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <li key={b.id} className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/gp/reservations/${b.id}`} className="font-semibold text-ink hover:underline">
                        {b.reference} · {gp.formatWeight(b.weight_grams)}
                      </Link>
                      <BookingBadge status={b.status} />
                    </div>
                    <p className="text-sm text-ink-soft">
                      {b.description} · pour {b.recipient_name}
                      {b.recipient_city ? ` (${b.recipient_city})` : ""}
                    </p>
                    {gp.contactsVisible(b) && b.sender_phone ? (
                      <div className="space-y-1">
                        <p className="text-sm">
                          Expéditeur : <span className="font-semibold">{b.sender_name}</span> · {formatPhone(b.sender_phone, country)}
                        </p>
                        <ContactButtons phone={b.sender_phone} message={`Bonjour ${b.sender_name}, je suis ${t.gp_name}, votre GP pour ${t.origin_city} → ${t.destination_city} (réservation ${b.reference}).`} />
                      </div>
                    ) : b.status === "a_payer" || b.status === "a_verifier" ? (
                      <p className="text-xs text-ink-muted">Coordonnées de l'expéditeur communiquées dès que les frais sont confirmés.</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Aucune réservation pour le moment.</p>
            )}
          </Card>
        ) : (
          <div className="space-y-5">
            {bookings.length ? (
              <Card title="Mes réservations sur ce voyage">
                <ul className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <li key={b.id}>
                      <Link href={`/gp/reservations/${b.id}`} className="flex items-center justify-between gap-2 py-2.5">
                        <span className="font-semibold text-ink">
                          {b.reference} · {gp.formatWeight(b.weight_grams)}
                        </span>
                        <BookingBadge status={b.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
            {bookable ? (
              <Card title="Réserver des kilos">
                <BookingForm
                  tripId={t.id}
                  maxKg={gp.formatWeight(left)}
                  fee={fee ? formatMoney(fee, country) : null}
                  phoneExample={country.phoneExample}
                  prohibited={gp.PROHIBITED_ITEMS}
                />
              </Card>
            ) : user.role === "merchant" ? (
              <Alert tone="warning">Ce voyage n'accepte plus de réservations.</Alert>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

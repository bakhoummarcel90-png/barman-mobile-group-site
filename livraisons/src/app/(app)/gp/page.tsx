import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Banknote, Plane, PlusCircle, Search, UserCheck } from "lucide-react";
import { BookingBadge, formatDay, TripBadge, TripCard } from "@/components/GpTripCard";
import { GpApplication, GpSettingsForm, PaymentDecision } from "@/components/GpForms";
import { Card, EmptyState, OkBanner, PageHeader, Stat } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import * as gp from "@/lib/gp";
import { paymentMethodLabel, SHIPPING_COUNTRIES } from "@/lib/regions";
import { pendingApplicants } from "@/lib/signup";
import type { Actor } from "@/lib/types";

export const metadata: Metadata = { title: "GP voyageurs" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | undefined>;

const OK = {
  "gp-accepte": "Inscription du GP acceptée : il peut se connecter et publier ses voyages.",
  "gp-refuse": "Inscription refusée : le compte est fermé.",
  "paiement-confirme": "Paiement confirmé : l'expéditeur et le GP ont reçu leurs coordonnées.",
  "paiement-refuse": "L'expéditeur est prévenu que son paiement n'a pas été retrouvé.",
};

export default async function GpPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireUser(["admin", "merchant", "gp"]);
  const params = await searchParams;
  if (user.role === "gp") return <GpHome user={user} />;
  if (user.role === "merchant") return <SenderHome user={user} params={params} />;
  return <AdminHome user={user} ok={params.ok} />;
}

/* ---------- GP : mes voyages ---------- */

function GpHome({ user }: { user: Actor }) {
  const trips = gp.listTrips(user);
  const upcoming = trips.filter((t) => t.status !== "annule");
  const cancelled = trips.filter((t) => t.status === "annule");
  return (
    <>
      <PageHeader
        title="Mes voyages"
        description="Publiez vos voyages : les expéditeurs réservent des kilos, vous recevez leurs coordonnées une fois les frais payés."
        actions={
          <Link href="/gp/voyages/nouveau" className="btn-primary">
            <PlusCircle className="h-4 w-4" aria-hidden /> Nouveau voyage
          </Link>
        }
      />
      {upcoming.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((t) => (
            <TripCard key={t.id} t={t} href={`/gp/voyages/${t.id}`} showStatus ownerView />
          ))}
        </div>
      ) : (
        <EmptyState icon={Plane} title="Aucun voyage publié">
          Indiquez votre prochain voyage (trajet, date, kilos disponibles, prix au kilo) pour recevoir des réservations.
          <Link href="/gp/voyages/nouveau" className="btn-primary mt-4">
            Publier un voyage
          </Link>
        </EmptyState>
      )}
      {cancelled.length ? (
        <p className="mt-6 text-sm text-ink-muted">
          {cancelled.length} voyage(s) annulé(s) :{" "}
          {cancelled.map((t, i) => (
            <span key={t.id}>
              {i ? ", " : ""}
              <Link className="link" href={`/gp/voyages/${t.id}`}>
                {t.origin_city} → {t.destination_city} ({formatDay(t.departure_date)})
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </>
  );
}

/* ---------- Expéditeur : chercher un GP ---------- */

function SenderHome({ user, params }: { user: Actor; params: Params }) {
  const country = countryOf(user);
  const filters = { from: params.de, to: params.vers, month: params.mois };
  const trips = gp.openTrips(user.companyId, filters);
  const bookings = gp.myBookings(user);
  const countries = Object.entries(SHIPPING_COUNTRIES).sort((a, b) => a[1].localeCompare(b[1], "fr"));
  const { fee } = gp.gpSettings(user.companyId);
  return (
    <>
      <PageHeader
        title="Envoyer un colis par GP"
        description={`Trouvez un voyageur qui part vers le pays de votre destinataire et réservez des kilos.${fee ? ` Frais de mise en relation : ${formatMoney(fee, country)} par réservation.` : ""}`}
      />
      {bookings.length ? (
        <Card title="Mes réservations" className="mb-5">
          <ul className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link href={`/gp/reservations/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-slate-50">
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">
                      {b.origin_city} → {b.destination_city} · {gp.formatWeight(b.weight_grams)}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {b.reference} · départ {formatDay(b.departure_date)} · GP {gp.publicName(b.gp_name)}
                    </span>
                  </span>
                  <BookingBadge status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-4 sm:items-end" role="search">
        <label className="block">
          <span className="label">Départ de</span>
          <select name="de" defaultValue={filters.from ?? ""} className="input">
            <option value="">Tous les pays</option>
            {countries.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Arrivée à</span>
          <select name="vers" defaultValue={filters.to ?? ""} className="input">
            <option value="">Tous les pays</option>
            {countries.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Mois du départ</span>
          <input type="month" name="mois" defaultValue={filters.month ?? ""} className="input" />
        </label>
        <button type="submit" className="btn-primary">
          <Search className="h-4 w-4" aria-hidden /> Rechercher
        </button>
      </form>
      {trips.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((t) => (
            <TripCard key={t.id} t={t} href={`/gp/voyages/${t.id}`} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Plane} title="Aucun voyage pour cette recherche">
          Essayez un autre mois ou un autre pays. De nouveaux voyages sont publiés régulièrement.
        </EmptyState>
      )}
    </>
  );
}

/* ---------- Administrateur ---------- */

function AdminHome({ user, ok }: { user: Actor; ok?: string }) {
  const country = countryOf(user);
  const counts = gp.gpCounts(user);
  const toVerify = gp.bookingsToVerify(user);
  const applicants = pendingApplicants(user, "gp");
  const trips = gp.listTrips(user);
  const recent = gp.recentBookings(user, 30);
  const settings = gp.gpSettings(user.companyId);
  return (
    <>
      <PageHeader
        title="GP voyageurs"
        description="Voyages publiés par les GP, réservations de kilos et frais de mise en relation."
        actions={
          <Link href="/voyages" className="btn-secondary" target="_blank">
            Page publique des voyages
          </Link>
        }
      />
      <OkBanner code={ok} messages={OK} />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Voyages ouverts" value={counts.trips} icon={Plane} />
        <Stat label="Paiements à vérifier" value={counts.toVerify} tone={counts.toVerify ? "warning" : "default"} icon={Banknote} href="#a-verifier" />
        <Stat label="GP à valider" value={counts.pendingGps} tone={counts.pendingGps ? "warning" : "default"} icon={UserCheck} href="#gp-a-valider" />
      </div>
      <div className="space-y-5">
        <Card title="Paiements à vérifier" id="a-verifier">
          {toVerify.length ? (
            <ul className="divide-y divide-slate-100">
              {toVerify.map((b) => (
                <li key={b.id} className="space-y-2 py-3">
                  <p className="font-semibold text-ink">
                    {formatMoney(b.fee, country)} · {paymentMethodLabel(country, b.payment_method)} · réf. <span className="font-mono">{b.payment_reference}</span>
                  </p>
                  <p className="text-sm text-ink-muted">
                    <Link className="link" href={`/gp/reservations/${b.id}`}>
                      {b.reference}
                    </Link>{" "}
                    · {b.sender_name} ({formatPhone(b.sender_phone, country)}) · {b.origin_city} → {b.destination_city}, {gp.formatWeight(b.weight_grams)} · déclaré{" "}
                    {formatDateTime(b.payment_declared_at, country)}
                  </p>
                  <PaymentDecision id={b.id} label={b.reference} fromList />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Aucun paiement en attente de vérification.</p>
          )}
        </Card>

        <Card title="GP à valider" id="gp-a-valider">
          {applicants.length ? (
            <ul className="divide-y divide-slate-100">
              {applicants.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span>
                    <span className="block font-semibold text-ink">{u.name}</span>
                    <span className="block text-sm text-ink-muted">
                      {formatPhone(u.phone, country)}
                      {u.email ? ` · ${u.email}` : ""}
                      {u.zone ? ` · trajets : ${u.zone}` : ""} · inscrit {formatDateTime(u.created_at, country)}
                    </span>
                  </span>
                  <GpApplication userId={u.id} name={u.name} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Aucune inscription de GP en attente.</p>
          )}
          <p className="mt-3 text-xs text-ink-muted">
            Avant d'accepter un GP, demandez-lui une pièce d'identité et, si possible, son billet d'avion : c'est la confiance de vos clients qui est en jeu.
          </p>
        </Card>

        <Card title="Voyages">
          {trips.length ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Départ</th>
                    <th>Trajet</th>
                    <th>GP</th>
                    <th>Réservés</th>
                    <th>Prix</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap">{formatDay(t.departure_date)}</td>
                      <td>
                        <Link className="link" href={`/gp/voyages/${t.id}`}>
                          {t.origin_city} → {t.destination_city}
                        </Link>
                      </td>
                      <td>{t.gp_name}</td>
                      <td className="whitespace-nowrap">
                        {gp.formatWeight(t.reserved_grams)} / {gp.formatWeight(t.capacity_grams)}
                      </td>
                      <td className="whitespace-nowrap">{gp.pricePerKgLabel(t)}</td>
                      <td>
                        <TripBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Aucun voyage publié pour le moment.</p>
          )}
        </Card>

        <Card title="Dernières réservations">
          {recent.length ? (
            <ul className="divide-y divide-slate-100">
              {recent.map((b) => (
                <li key={b.id}>
                  <Link href={`/gp/reservations/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-slate-50">
                    <span className="text-sm">
                      <span className="font-semibold text-ink">{b.reference}</span> · {b.sender_name} → GP {b.gp_name} · {gp.formatWeight(b.weight_grams)} ·{" "}
                      {b.origin_city} → {b.destination_city}
                    </span>
                    <BookingBadge status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Aucune réservation pour le moment.</p>
          )}
        </Card>

        <Card title={<span className="inline-flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-brand-600" aria-hidden /> Réglages GP</span>}>
          <GpSettingsForm fee={settings.fee} paymentInfo={settings.paymentInfo} currencyLabel={country.currencyLabel} />
        </Card>
      </div>
    </>
  );
}

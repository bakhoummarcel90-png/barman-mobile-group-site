import Link from "next/link";
import { ArrowRight, CalendarDays, Plane, Star } from "lucide-react";
import {
  BOOKING_STATUS_LABELS,
  dayLabel,
  formatWeight,
  pricePerKgLabel,
  publicName,
  remainingGrams,
  TRIP_STATUS_LABELS,
  type BookingStatus,
  type GpTripView,
  type TripStatus,
} from "@/lib/gp";
import { shippingCountryName } from "@/lib/regions";
import { cx } from "./ui";

/** « 2026-12-05 » → « sam. 5 décembre ». */
export const formatDay = dayLabel;

const TRIP_STYLE: Record<TripStatus, string> = {
  ouvert: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  complet: "bg-slate-100 text-slate-700 ring-slate-200",
  annule: "bg-red-50 text-red-700 ring-red-200",
};

const BOOKING_STYLE: Record<BookingStatus, string> = {
  a_payer: "bg-amber-50 text-amber-800 ring-amber-200",
  a_verifier: "bg-sky-50 text-sky-800 ring-sky-200",
  confirmee: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  livree: "bg-brand-50 text-brand-800 ring-brand-200",
  annulee: "bg-slate-100 text-slate-600 ring-slate-200",
};

const badge = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset";

export function TripBadge({ status }: { status: TripStatus }) {
  return <span className={cx(badge, TRIP_STYLE[status])}>{TRIP_STATUS_LABELS[status]}</span>;
}

export function BookingBadge({ status }: { status: BookingStatus }) {
  return <span className={cx(badge, BOOKING_STYLE[status])}>{BOOKING_STATUS_LABELS[status]}</span>;
}

export function Rating({ avg, count }: { avg: number | null; count: number }) {
  if (!count || avg === null) return <span className="text-xs text-ink-muted">Nouveau GP</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      {avg.toLocaleString("fr-FR")} ({count} avis)
    </span>
  );
}

/** Carte d'un voyage : trajet, dates, kilos restants, prix au kilo. */
export function TripCard({ t, href, showStatus = false, ownerView = false }: { t: GpTripView; href: string; showStatus?: boolean; ownerView?: boolean }) {
  const left = remainingGrams(t);
  return (
    <Link href={href} className="card block space-y-3 p-4 transition hover:border-brand-300 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted">
          <Plane className="h-4 w-4 text-brand-600" aria-hidden />
          {ownerView ? `${t.booking_count} réservation(s)` : publicName(t.gp_name)}
        </span>
        {showStatus ? <TripBadge status={t.status} /> : <Rating avg={t.rating_avg} count={t.rating_count} />}
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-lg font-semibold text-ink">
        {t.origin_city} <ArrowRight className="h-4 w-4 text-ink-muted" aria-hidden /> {t.destination_city}
      </p>
      <p className="-mt-2 text-xs text-ink-muted">
        {shippingCountryName(t.origin_country)} → {shippingCountryName(t.destination_country)}
      </p>
      <p className="flex items-center gap-1.5 text-sm text-ink-soft">
        <CalendarDays className="h-4 w-4" aria-hidden /> Départ {formatDay(t.departure_date)}
        {t.arrival_date ? ` · arrivée ${formatDay(t.arrival_date)}` : ""}
      </p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-brand-50 p-2">
          <p className="text-xs text-brand-800">Prix</p>
          <p className="font-bold text-brand-800">{pricePerKgLabel(t)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-xs text-ink-muted">{ownerView ? "Réservés" : "Kilos restants"}</p>
          <p className="font-bold text-ink">{ownerView ? `${formatWeight(t.reserved_grams)} / ${formatWeight(t.capacity_grams)}` : formatWeight(left)}</p>
        </div>
      </div>
      {ownerView && t.to_verify_count ? <p className="text-xs font-semibold text-sky-800">{t.to_verify_count} paiement(s) en cours de vérification</p> : null}
    </Link>
  );
}

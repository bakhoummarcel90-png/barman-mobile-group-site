import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, Package, Phone } from "lucide-react";
import { ShipmentBadge } from "@/components/ui";
import { SHIPMENT_STATUS_LABELS, TRANSPORT_MODES } from "@/lib/constants";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { getCountry } from "@/lib/regions";
import { publicTracking } from "@/lib/shipments";

export const metadata: Metadata = { title: "Suivi de colis" };
export const dynamic = "force-dynamic";

/** Page publique de suivi : étapes et villes uniquement (pas de nom, téléphone ni note interne). */
export default async function TrackPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const t = publicTracking(decodeURIComponent(numero));

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/suivi" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
          <Package className="h-4 w-4" aria-hidden /> Suivre un autre colis
        </Link>
        {!t ? (
          <div className="card p-6 text-center">
            <h1 className="text-lg font-semibold text-ink">Numéro de suivi introuvable</h1>
            <p className="mt-2 text-sm text-ink-muted">Vérifiez le numéro (il commence par SL et compte 10 caractères), ou contactez l'entreprise qui vous l'a transmis.</p>
          </div>
        ) : (
          <TrackingCard t={t} />
        )}
      </div>
    </main>
  );
}

function TrackingCard({ t }: { t: NonNullable<ReturnType<typeof publicTracking>> }) {
  const country = getCountry(t.company_country);
  return (
    <div className="card overflow-hidden">
      <div className="bg-brand-700 px-5 py-4 text-white">
        <p className="text-xs uppercase tracking-wide text-brand-100">Colis n°</p>
        <h1 className="font-mono text-2xl font-bold">{t.tracking_number}</h1>
        <p className="mt-1 text-sm text-brand-100">Suivi assuré par {t.company_name}</p>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ShipmentBadge status={t.status} />
          <span className="text-sm text-ink-muted">{TRANSPORT_MODES[t.transport_mode] ?? t.transport_mode}</span>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p>
            <span className="text-ink-muted">De :</span> <strong>{t.origin}</strong>
          </p>
          <p>
            <span className="text-ink-muted">Vers :</span> <strong>{t.destination}</strong>
          </p>
          <p className="mt-1 text-ink-muted">
            {t.pieces} colis
            {t.estimated_arrival && t.status !== "livre" ? ` · arrivée estimée le ${formatDate(`${t.estimated_arrival}T12:00:00Z`, country)}` : ""}
          </p>
        </div>
        <ol className="space-y-4">
          {t.events.map((e, i) => (
            <li key={`${e.created_at}-${i}`} className="flex gap-3">
              {i === 0 ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" aria-hidden />}
              <div>
                <p className={i === 0 ? "font-semibold text-ink" : "text-ink-soft"}>{SHIPMENT_STATUS_LABELS[e.status]}</p>
                {e.location ? <p className="text-sm text-ink-muted">{e.location}</p> : null}
                <p className="text-xs text-ink-muted">{formatDateTime(e.created_at, country)}</p>
              </div>
            </li>
          ))}
        </ol>
        {t.company_phone ? (
          <a href={`tel:${t.company_phone}`} className="btn-secondary w-full">
            <Phone className="h-4 w-4" aria-hidden /> Contacter {t.company_name} ({formatPhone(t.company_phone, country)})
          </a>
        ) : null}
        <p className="text-xs text-ink-muted">Les étapes sont mises à jour par l'entreprise de livraison d'après les informations du transporteur.</p>
      </div>
    </div>
  );
}

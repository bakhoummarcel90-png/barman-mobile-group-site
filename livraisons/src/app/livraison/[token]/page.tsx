import type { Metadata } from "next";
import { CheckCircle2, Circle, Phone, Star } from "lucide-react";
import { LiveMap, type MapPoint } from "@/components/LiveMap";
import { StatusBadge } from "@/components/ui";
import { STATUS_LABELS } from "@/lib/constants";
import { publicDelivery } from "@/lib/deliveries";
import { formatDateTime, formatPhone, formatTime } from "@/lib/format";
import { coordsOf } from "@/lib/pricing";
import { getCountry } from "@/lib/regions";
import { RateForm } from "./RateForm";

export const metadata: Metadata = { title: "Suivi de livraison", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Suivi public d'une livraison locale : étapes, livreur sur la carte, note. Sans téléphone ni adresse exacte du client. */
export default async function DeliveryTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = publicDelivery(token);
  if (!d) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="card max-w-md p-6 text-center">
          <h1 className="text-lg font-semibold text-ink">Lien de suivi introuvable</h1>
          <p className="mt-2 text-sm text-ink-muted">Vérifiez le lien reçu, ou contactez la boutique.</p>
        </div>
      </main>
    );
  }
  const country = getCountry(d.country_code);
  const live = d.status === "en_cours" || d.status === "attribuee";
  const points: MapPoint[] = [];
  const from = coordsOf(d.merchant_neighborhood);
  const to = coordsOf(d.neighborhood);
  if (from) points.push({ lat: from[0], lng: from[1], label: "Départ", color: "#64748b" });
  if (to) points.push({ lat: to[0], lng: to[1], label: "Votre quartier", color: "#0b8a6b" });
  if (d.courier_lat !== null && d.courier_lng !== null) points.push({ lat: d.courier_lat, lng: d.courier_lng, label: `Livreur${d.courier_first_name ? ` (${d.courier_first_name})` : ""}`, color: "#7c3aed" });

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-6">
      {live ? <meta httpEquiv="refresh" content="30" /> : null}
      <div className="mx-auto max-w-lg space-y-4">
        <div className="card overflow-hidden">
          <div className="bg-brand-700 px-5 py-4 text-white">
            <p className="text-lg font-semibold">Commande de {d.merchant_name}</p>
            <p className="text-sm text-brand-100">
              N° {d.reference} · livrée par {d.company_name}
            </p>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={d.status} />
              {d.courier_first_name ? (
                <span className="text-sm text-ink-muted">
                  Livreur : {d.courier_first_name}
                  {d.vehicle_type ? ` · ${d.vehicle_type}` : ""}
                </span>
              ) : null}
            </div>
            {d.scheduled_at && live ? <p className="text-sm text-ink-soft">Livraison prévue vers {formatTime(d.scheduled_at, country)}.</p> : null}
            {points.length ? <LiveMap points={points} /> : null}
            {live ? (
              <p className="text-xs text-ink-muted">
                {d.courier_lat !== null
                  ? `Position du livreur mise à jour ${d.courier_pos_at ? `à ${formatTime(d.courier_pos_at, country)}` : ""} ; cette page s'actualise toutes les 30 secondes.`
                  : "La position du livreur s'affichera dès qu'il sera en route."}
              </p>
            ) : null}
            <ol className="space-y-3">
              {d.events.map((e, i) => (
                <li key={`${e.created_at}-${i}`} className="flex gap-3">
                  {i === 0 ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" aria-hidden />}
                  <div>
                    <p className={i === 0 ? "font-semibold text-ink" : "text-ink-soft"}>{e.to_status === "a_attribuer" ? "Commande enregistrée" : STATUS_LABELS[e.to_status]}</p>
                    <p className="text-xs text-ink-muted">{formatDateTime(e.created_at, country)}</p>
                  </div>
                </li>
              ))}
            </ol>
            {d.company_phone ? (
              <a href={`tel:${d.company_phone}`} className="btn-secondary w-full">
                <Phone className="h-4 w-4" aria-hidden /> Contacter {d.company_name} ({formatPhone(d.company_phone, country)})
              </a>
            ) : null}
          </div>
        </div>
        {d.status === "livree" ? (
          <div className="card p-5">
            {d.rating ? (
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden /> Merci, vous avez noté cette livraison {d.rating}/5.
              </p>
            ) : (
              <RateForm token={token} />
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

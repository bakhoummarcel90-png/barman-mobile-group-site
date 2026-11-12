import type { Metadata } from "next";
import { ArrowRight, Clock, Package, Star } from "lucide-react";
import { AcceptButton } from "@/components/AcceptButton";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { availableForCourier } from "@/lib/deliveries";
import { formatDateTime, formatMoney } from "@/lib/format";
import { OPTIONS, type OptionCode } from "@/lib/pricing";

export const metadata: Metadata = { title: "Courses disponibles" };
export const dynamic = "force-dynamic";

/** Bourse aux courses : le livreur voit les courses à attribuer adaptées à son véhicule et les accepte. */
export default async function AvailablePage() {
  const user = await requireUser(["courier"]);
  const country = countryOf(user);
  const rows = availableForCourier(user) as (Awaited<ReturnType<typeof availableForCourier>>[number] & { merchant_neighborhood: string | null })[];
  return (
    <>
      <meta httpEquiv="refresh" content="60" />
      <PageHeader title="Courses disponibles" description="Le premier livreur qui accepte obtient la course. La liste se met à jour toutes les minutes." />
      {rows.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((d) => {
            const opts = (JSON.parse(d.options ?? "[]") as OptionCode[]).filter((o) => o in OPTIONS);
            return (
              <div key={d.id} className="card space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink-soft">{d.vehicle_type ?? "Moto"}</span>
                  {d.preferred_courier_id === user.id ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      <Star className="h-3.5 w-3.5" aria-hidden /> Proposée à vous en priorité
                    </span>
                  ) : null}
                </div>
                <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
                  {d.merchant_neighborhood ?? d.merchant_name} <ArrowRight className="h-4 w-4 text-ink-muted" aria-hidden /> {d.neighborhood}
                </p>
                <p className="text-sm text-ink-muted">
                  {d.merchant_name}
                  {d.distance_km ? ` · ≈ ${d.distance_km.toLocaleString("fr-FR")} km` : ""}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-brand-50 p-2">
                    <p className="text-xs text-brand-800">Prix de la course</p>
                    <p className="font-bold text-brand-800">{formatMoney(d.delivery_fee, country)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-xs text-ink-muted">À encaisser</p>
                    <p className="font-bold text-ink">{formatMoney(d.amount_to_collect, country)}</p>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <Clock className="h-4 w-4" aria-hidden /> {d.scheduled_at ? formatDateTime(d.scheduled_at, country) : "Dès que possible"}
                </p>
                {opts.length ? <p className="text-xs text-amber-800">Options : {opts.map((o) => OPTIONS[o]).join(" · ")}</p> : null}
                <AcceptButton id={d.id} />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Package} title="Aucune course disponible pour le moment">
          Les nouvelles courses adaptées à votre véhicule apparaîtront ici.
        </EmptyState>
      )}
    </>
  );
}

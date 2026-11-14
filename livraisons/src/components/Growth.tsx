import { Gift } from "lucide-react";
import type { GrowthTotals, GrowthWeek } from "@/lib/growth";
import { Card } from "./ui";

const WEEK_FMT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

/** Bandeau affiché quand les frais de mise en relation sont à 0. */
export function LaunchBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 ${className}`} role="status">
      <Gift className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
      <p className="text-sm">
        <span className="block text-base font-bold">Gratuit pendant le lancement</span>
        Aucun frais de mise en relation : réservez un GP et recevez son contact tout de suite. Profitez-en !
      </p>
    </div>
  );
}

const COLS: { key: keyof Omit<GrowthWeek, "start">; label: string }[] = [
  { key: "signups", label: "Inscriptions" },
  { key: "deliveries", label: "Commandes" },
  { key: "gpTrips", label: "Voyages GP" },
  { key: "gpBookings", label: "Réservations GP" },
];

/** Tableau de suivi de la croissance (administrateur). */
export function GrowthCard({ totals, weeks, free }: { totals: GrowthTotals; weeks: GrowthWeek[]; free: boolean }) {
  const max = Math.max(1, ...weeks.flatMap((w) => COLS.map((c) => w[c.key])));
  const tiles: [string, number][] = [
    ["Commerçants", totals.merchants],
    ["Particuliers", totals.individuals],
    ["Livreurs", totals.couriers],
    ["GP", totals.gps],
    ["Commandes", totals.deliveries],
    ["Réservations GP", totals.gpBookings],
  ];
  return (
    <Card title="Croissance de l'application" className="mt-5">
      <p className="mb-3 text-sm text-ink-muted">
        {free
          ? "Période de lancement : les frais GP sont à 0. Fixez-vous un objectif (ex. 50 GP ou 200 réservations) avant de les activer dans GP voyageurs → Réglages GP."
          : "Comptes actifs et activité des dernières semaines."}
      </p>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-2 text-center">
            <p className="text-xl font-bold tabular-nums text-ink">{value}</p>
            <p className="text-[11px] text-ink-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Semaine du</th>
              {COLS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={w.start}>
                <td className="whitespace-nowrap">
                  {WEEK_FMT.format(new Date(`${w.start}T00:00:00Z`))}
                  {i === 0 ? <span className="text-ink-muted"> (en cours)</span> : null}
                </td>
                {COLS.map((c) => (
                  <td key={c.key}>
                    <span className="flex items-center gap-2">
                      <span className="w-6 text-right tabular-nums">{w[c.key]}</span>
                      <span className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.round((w[c.key] / max) * 60)}px` }} aria-hidden />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

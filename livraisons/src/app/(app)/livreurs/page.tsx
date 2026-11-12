import type { Metadata } from "next";
import Link from "next/link";
import { Bike, Plus } from "lucide-react";
import { ActiveBadge, EmptyState, OkBanner, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import { courierRating } from "@/lib/deliveries";
import { listCouriers } from "@/lib/people";
import { pendingCouriers } from "@/lib/signup";
import { CourierApplication } from "@/components/PeopleForms";

export const metadata: Metadata = { title: "Livreurs" };

export default async function CouriersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser(["admin"]);
  const country = countryOf(user);
  // Hors liste : inscriptions en attente (section dédiée) et comptes supprimés ou refusés (anonymisés, sans téléphone).
  const couriers = listCouriers(user).filter((c) => !c.pending && c.email_verified && (c.active || c.phone || c.email));
  const pending = pendingCouriers(user);
  return (
    <>
      <PageHeader
        title="Livreurs"
        description={`${couriers.filter((c) => c.active).length} actif(s) sur ${couriers.length}`}
        actions={
          <Link href="/livreurs/nouveau" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden /> Ajouter un livreur
          </Link>
        }
      />
      <OkBanner
        code={(await searchParams).ok}
        messages={{
          accepte: "Livreur accepté : il peut se connecter et vous pouvez lui attribuer des courses.",
          refuse: "Inscription refusée : le compte est fermé et ses coordonnées effacées.",
        }}
      />
      {pending.length ? (
        <section id="a-valider" className="card mb-5 scroll-mt-20 border-amber-300 p-4 sm:p-5">
          <h2 className="font-semibold text-ink">Inscriptions à valider ({pending.length})</h2>
          <p className="mt-1 text-sm text-ink-muted">Ces personnes se sont inscrites comme livreur. Vérifiez leur identité (appel, rencontre) avant d'accepter.</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {pending.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-sm text-ink-muted">
                    <a href={`tel:${c.phone}`} className="link">
                      {formatPhone(c.phone, country)}
                    </a>
                    {c.vehicle ? ` · ${c.vehicle}` : ""}
                    {c.zone ? ` · ${c.zone}` : ""}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                  <p className="text-xs text-ink-muted">Inscrit le {formatDateTime(c.created_at, country)}</p>
                </div>
                <CourierApplication userId={c.id} name={c.name} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {couriers.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {couriers.map((c) => (
            <Link key={c.id} href={`/livreurs/${c.id}`} className={`card block p-4 transition hover:shadow-md ${c.active ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{c.name}</p>
                  <p className="text-sm text-ink-muted">{formatPhone(c.phone, country)}</p>
                </div>
                <ActiveBadge active={c.active} />
              </div>
              {(() => {
                const r = courierRating(user.companyId, c.id);
                return r.count ? <p className="text-xs font-semibold text-amber-700">★ {r.avg}/5 · {r.count} avis</p> : null;
              })()}
              <p className="mt-1 text-xs text-ink-muted">
                {c.vehicle ?? "Transport non précisé"}
                {c.zone ? ` · ${c.zone}` : ""}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="text-[11px] text-ink-muted">En cours</dt>
                  <dd className="font-bold text-violet-700">{c.active_count}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="text-[11px] text-ink-muted">Livrées auj.</dt>
                  <dd className="font-bold text-emerald-700">{c.delivered_today}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="text-[11px] text-ink-muted">À remettre</dt>
                  <dd className="text-xs font-bold tabular-nums">{formatMoney(c.cash_held, country)}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bike} title="Aucun livreur">
          Ajoutez vos livreurs : ils se connecteront avec leur numéro de téléphone.
        </EmptyState>
      )}
    </>
  );
}

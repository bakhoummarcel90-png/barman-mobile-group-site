import type { Metadata } from "next";
import Link from "next/link";
import { Bike, Plus } from "lucide-react";
import { ActiveBadge, EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { formatMoney, formatPhone } from "@/lib/format";
import { listCouriers } from "@/lib/people";

export const metadata: Metadata = { title: "Livreurs" };

export default async function CouriersPage() {
  const user = await requireUser(["admin"]);
  const country = countryOf(user);
  const couriers = listCouriers(user);
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

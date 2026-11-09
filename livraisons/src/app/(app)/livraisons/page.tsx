import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Inbox, MapPin, Plus, Undo2 } from "lucide-react";
import { AssignForm } from "@/components/DeliveryActions";
import { DeliveryCard, DeliveryList } from "@/components/DeliveryList";
import { Card, EmptyState, OkBanner, PageHeader, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { courierDay, listDeliveries } from "@/lib/deliveries";
import { parseFilters } from "@/lib/filters";
import { courierBalances } from "@/lib/finance";
import { formatDateTime, formatMoney, formatTime } from "@/lib/format";
import { courierOptions } from "@/lib/people";
import type { CountryConfig } from "@/lib/regions";
import type { Actor, DeliveryView } from "@/lib/types";

export const metadata: Metadata = { title: "Livraisons" };

export default async function DeliveriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const country = countryOf(user);
  if (user.role === "courier") return <CourierDay user={user} country={country} />;
  if (user.role === "merchant") return <MerchantTracking user={user} country={country} />;
  const ok = (await searchParams).ok;
  return (
    <>
      <OkBanner code={ok} messages={{ attribuee: "Livreur attribué. La course apparaît dans « En cours par livreur »." }} />
      <Dispatch user={user} country={country} />
    </>
  );
}

/* ---------- Livreur : la journée ---------- */

function CourierDay({ user, country }: { user: Actor; country: CountryConfig }) {
  const { todo, toReturn, done } = courierDay(user);
  const held = courierBalances(user)[0]?.total ?? 0;
  const collectedToday = done.reduce((s, d) => s + (d.collected_amount ?? 0), 0);
  return (
    <>
      <PageHeader title="Mes livraisons" description={new Intl.DateTimeFormat(country.locale, { timeZone: country.timezone, dateStyle: "full" }).format(new Date())} />
      <div className="mb-5 grid grid-cols-3 gap-2 text-center">
        <div className="card p-3">
          <p className="text-2xl font-bold text-violet-700">{todo.length}</p>
          <p className="text-xs text-ink-muted">À faire</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-emerald-700">{done.length}</p>
          <p className="text-xs text-ink-muted">Terminées</p>
        </div>
        <Link href="/encaissements" className="card p-3">
          <p className="text-lg font-bold tabular-nums text-ink">{formatMoney(held, country)}</p>
          <p className="text-xs text-ink-muted">À remettre</p>
        </Link>
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">À livrer</h2>
      {todo.length ? (
        <div className="grid gap-3">
          {todo.map((d) => (
            <CourierCard key={d.id} d={d} country={country} />
          ))}
        </div>
      ) : (
        <EmptyState icon={CheckCircle2} title="Aucune livraison en attente">
          Les nouvelles courses attribuées par l'administrateur apparaîtront ici.
        </EmptyState>
      )}

      {toReturn.length ? (
        <>
          <h2 className="mb-2 mt-6 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-orange-700">
            <Undo2 className="h-4 w-4" aria-hidden /> À rapporter au commerçant
          </h2>
          <div className="grid gap-3">
            {toReturn.map((d) => (
              <DeliveryCard key={d.id} d={d} country={country} role="courier" />
            ))}
          </div>
        </>
      ) : null}

      {done.length ? (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Terminées aujourd'hui · {formatMoney(collectedToday, country)} encaissés
          </h2>
          <div className="grid gap-3">
            {done.map((d) => (
              <DeliveryCard key={d.id} d={d} country={country} role="courier" />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

function CourierCard({ d, country }: { d: DeliveryView; country: CountryConfig }) {
  return (
    <Link href={`/commandes/${d.id}`} className={`card block p-4 active:bg-slate-50 ${d.status === "en_cours" ? "border-violet-300 ring-2 ring-violet-200" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={d.status} />
        <span className="flex items-center gap-1 text-sm font-semibold text-ink">
          <Clock className="h-4 w-4 text-ink-muted" aria-hidden />
          {d.scheduled_at ? formatTime(d.scheduled_at, country) : "—"}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold text-ink">{d.customer_name}</p>
      <p className="flex items-start gap-1.5 text-sm text-ink-soft">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <strong>{d.neighborhood}</strong> — {d.address}
        </span>
      </p>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
        <span className="text-sm text-ink-muted">À encaisser</span>
        <span className="text-lg font-bold tabular-nums text-ink">{formatMoney(d.amount_to_collect, country)}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-brand-700">{d.status === "en_cours" ? "Confirmer ou signaler un échec →" : "Ouvrir et démarrer la course →"}</p>
    </Link>
  );
}

/* ---------- Commerçant : suivi ---------- */

function MerchantTracking({ user, country }: { user: Actor; country: CountryConfig }) {
  const filters = parseFilters({ statut: "actives" }, country.timezone);
  const { rows } = listDeliveries(user, filters, { limit: 200, order: "schedule" });
  return (
    <>
      <PageHeader
        title="Suivi des livraisons"
        description="Commandes en attente, en route ou en échec"
        actions={
          <Link href="/commandes/nouvelle" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden /> Nouvelle commande
          </Link>
        }
      />
      {rows.length ? (
        <DeliveryList rows={rows} country={country} role="merchant" />
      ) : (
        <EmptyState title="Aucune livraison en cours">
          Toutes vos commandes sont terminées. Consultez l'historique dans <Link className="link" href="/commandes">Commandes</Link>.
        </EmptyState>
      )}
    </>
  );
}

/* ---------- Administrateur : répartition ---------- */

function Dispatch({ user, country }: { user: Actor; country: CountryConfig }) {
  const active = listDeliveries(user, parseFilters({ statut: "actives" }, country.timezone), { limit: 500, order: "schedule" }).rows;
  const couriers = courierOptions(user);
  const now = new Date().toISOString();
  const toAssign = active.filter((d) => d.status === "a_attribuer");
  const late = active.filter((d) => (d.status === "a_attribuer" || d.status === "attribuee") && d.scheduled_at && d.scheduled_at < now);
  const failed = active.filter((d) => d.status === "echec");
  const byCourier = new Map<string, DeliveryView[]>();
  for (const d of active.filter((x) => x.status === "attribuee" || x.status === "en_cours")) {
    const k = d.courier_name ?? "—";
    byCourier.set(k, [...(byCourier.get(k) ?? []), d]);
  }

  return (
    <>
      <PageHeader
        title="Livraisons"
        description="Répartition des courses en attente et suivi des livreurs"
        actions={
          <Link href="/commandes/nouvelle" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden /> Nouvelle commande
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card id="a-attribuer" title={`À attribuer (${toAssign.length})`}>
          {toAssign.length ? (
            <ul className="space-y-3">
              {toAssign.map((d) => (
                <li key={d.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/commandes/${d.id}`} className="link text-sm">
                        {d.reference}
                      </Link>
                      <p className="truncate font-semibold text-ink">
                        {d.customer_name} · {d.neighborhood}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {d.merchant_name} · {d.scheduled_at ? formatDateTime(d.scheduled_at, country) : "sans horaire"} ·{" "}
                        {formatMoney(d.amount_to_collect, country)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <AssignForm d={d} couriers={couriers} from="livraisons" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Inbox} title="Tout est attribué" />
          )}
        </Card>

        <div className="space-y-5">
          <Card id="en-retard" title={`En retard (${late.length})`}>
            {late.length ? (
              <ul className="divide-y divide-slate-100">
                {late.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <Link href={`/commandes/${d.id}`} className="link">
                      {d.reference}
                    </Link>
                    <span className="truncate text-ink-soft">{d.courier_name ?? "Non attribuée"}</span>
                    <span className="whitespace-nowrap font-semibold text-red-700">prévue {formatDateTime(d.scheduled_at, country)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Aucune livraison en retard.</p>
            )}
          </Card>

          <Card title={`Échecs à traiter (${failed.length})`}>
            {failed.length ? (
              <ul className="divide-y divide-slate-100">
                {failed.map((d) => (
                  <li key={d.id} className="py-2 text-sm">
                    <Link href={`/commandes/${d.id}`} className="link">
                      {d.reference}
                    </Link>{" "}
                    — {d.customer_name} · <span className="text-red-700">{d.failure_reason}</span>
                    <p className="text-xs text-ink-muted">Ouvrez la livraison pour relancer une tentative ou enregistrer le retour.</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Aucun échec en attente.</p>
            )}
          </Card>
        </div>
      </div>

      <h2 className="mb-3 mt-6 text-lg font-semibold text-ink">En cours par livreur</h2>
      {byCourier.size ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...byCourier.entries()].map(([name, list]) => (
            <Card key={name} title={name} actions={<span className="text-xs text-ink-muted">{list.length} course(s)</span>}>
              <ul className="space-y-2">
                {list.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/commandes/${d.id}`} className="min-w-0 truncate hover:underline">
                      <span className="font-medium">{d.neighborhood}</span> · {d.customer_name}
                    </Link>
                    <StatusBadge status={d.status} />
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune course en route">Attribuez des commandes pour qu'elles apparaissent ici.</EmptyState>
      )}
    </>
  );
}

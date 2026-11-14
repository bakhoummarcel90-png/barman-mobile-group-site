import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Banknote, Bike, CheckCircle2, Inbox, Plus, Wallet, XCircle } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { GrowthCard } from "@/components/Growth";
import { gpSettings } from "@/lib/gp";
import { growthStats } from "@/lib/growth";
import { Timeline } from "@/components/Timeline";
import { Alert, Card, PageHeader, Stat, cx } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { dashboardData } from "@/lib/dashboard";
import { recentEvents } from "@/lib/events";
import { filtersToQuery, parseFilters, PERIODS } from "@/lib/filters";
import { formatMoney } from "@/lib/format";
import { courierOptions, merchantOptions } from "@/lib/people";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  if (user.role === "courier") redirect("/livraisons");
  const country = countryOf(user);
  const sp = await searchParams;
  const filters = parseFilters(sp, country.timezone, "7d");
  const data = dashboardData(user, filters);
  const events = recentEvents(user, { limit: 12, merchantId: filters.merchantId, courierId: filters.courierId });
  const isAdmin = user.role === "admin";
  const growth = isAdmin ? growthStats(user) : null;
  const link = (status: string) => `/commandes${filtersToQuery({ ...filters, status: null }, { statut: status })}`;

  return (
    <>
      <PageHeader
        title={isAdmin ? "Tableau de bord" : `Bonjour ${user.name.split(" ")[0]}`}
        description={`${PERIODS[filters.period]}${filters.period === "custom" ? ` : ${filters.from || "…"} → ${filters.to || "…"}` : ""} · selon la date prévue de livraison`}
        actions={
          <Link href="/commandes/nouvelle" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden /> Nouvelle commande
          </Link>
        }
      />

      {sp.bienvenue === "1" ? (
        <div className="mb-4">
          <Alert tone="success">
            Bienvenue ! Votre compte est créé. Créez votre première livraison avec « Nouvelle commande », ou enregistrez un envoi
            international dans « Colis ».
          </Alert>
        </div>
      ) : null}
      <FilterBar
        filters={filters}
        merchants={isAdmin ? merchantOptions(user) : []}
        couriers={isAdmin ? courierOptions(user) : []}
        showStatus={false}
        showSearch={false}
        basePath="/tableau-de-bord"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="À attribuer" value={data.counts.a_attribuer} tone="warning" icon={Inbox} href={link("a_attribuer")} hint="En attente d'un livreur" />
        <Stat
          label="En cours"
          value={data.counts.attribuee + data.counts.en_cours}
          tone="info"
          icon={Bike}
          href={link("actives")}
          hint={`${data.counts.en_cours} en route · ${data.counts.attribuee} attribuée(s)`}
        />
        <Stat label="Livrées" value={data.counts.livree} tone="success" icon={CheckCircle2} href={link("livree")} hint={`${formatMoney(data.collected, country)} encaissés`} />
        <Stat
          label="Échecs"
          value={data.counts.echec + data.counts.retour_commercant}
          tone="danger"
          icon={XCircle}
          href={link("echec")}
          hint={`${data.counts.retour_commercant} retour(s) au commerçant`}
        />
      </div>

      <div className={cx("mt-3 grid gap-3", isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <Stat
          label={isAdmin ? "À reverser aux commerçants" : "Montant qui vous est dû"}
          value={formatMoney(data.toMerchants, country)}
          icon={Wallet}
          href="/encaissements"
          hint="Encaissements confirmés, frais de livraison déduits"
        />
        <Stat
          label="En cours de vérification"
          value={formatMoney(data.pendingVerification, country)}
          icon={AlertTriangle}
          href="/encaissements"
          hint="Saisis par les livreurs, pas encore confirmés"
        />
        {isAdmin ? (
          <Stat
            label="Détenu par les livreurs"
            value={formatMoney(data.heldByCouriers, country)}
            icon={Banknote}
            href="/encaissements#livreurs"
            hint="Encaissé, pas encore remis à la caisse"
          />
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card title="Actions à effectuer" className="lg:col-span-2">
          {data.actions.length ? (
            <ul className="-my-2 divide-y divide-slate-100">
              {data.actions.map((a) => (
                <li key={a.label}>
                  <Link href={a.href} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <span
                      className={cx(
                        "flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold",
                        a.tone === "danger" ? "bg-red-100 text-red-800" : a.tone === "warning" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800",
                      )}
                    >
                      {a.count}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{a.label}</span>
                      <span className="block text-xs text-ink-muted">{a.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Alert tone="success">Rien d'urgent : tout est à jour.</Alert>
          )}
        </Card>

        <Card title="Derniers événements" className="lg:col-span-3">
          <Timeline events={events} country={country} showDelivery />
        </Card>
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Total sur la période : {data.total} commande(s), dont {data.counts.annulee} annulée(s). Frais de livraison des commandes livrées :{" "}
        {formatMoney(data.fees, country)}.
      </p>
      {growth ? <GrowthCard totals={growth.totals} weeks={growth.weeks} free={gpSettings(user.companyId).fee === 0} /> : null}
    </>
  );
}

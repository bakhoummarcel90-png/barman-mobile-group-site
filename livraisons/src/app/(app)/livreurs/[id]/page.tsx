import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourierForm, ResetPassword, ToggleUser } from "@/components/PeopleForms";
import { DeliveryList } from "@/components/DeliveryList";
import { Timeline } from "@/components/Timeline";
import { ActiveBadge, Card, DefinitionList, EmptyState, PageHeader, Stat } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { listDeliveries } from "@/lib/deliveries";
import { userActivity } from "@/lib/events";
import { parseFilters } from "@/lib/filters";
import { formatDateTime, formatMoney } from "@/lib/format";
import { listCouriers, VEHICLES } from "@/lib/people";

export const metadata: Metadata = { title: "Livreur" };

export default async function CourierPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  const country = countryOf(user);
  const id = Number((await params).id);
  const c = listCouriers(user).find((x) => x.id === id);
  if (!c) notFound();
  const active = listDeliveries(user, parseFilters({ livreur: String(id), statut: "actives" }, country.timezone), { limit: 50, order: "schedule" }).rows;
  const activity = userActivity(user, id, 25);

  return (
    <>
      <PageHeader
        title={c.name}
        description={<ActiveBadge active={c.active} />}
        back={{ href: "/livreurs", label: "Livreurs" }}
        actions={
          <Link href={`/commandes?livreur=${id}`} className="btn-secondary">
            Toutes ses livraisons
          </Link>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="En cours" value={c.active_count} tone="info" />
        <Stat label="Livrées aujourd'hui" value={c.delivered_today} tone="success" />
        <Stat label="Livrées au total" value={c.delivered_total} hint={`${c.failed_total} échec(s)`} />
        <Stat label="À remettre" value={formatMoney(c.cash_held, country)} href="/encaissements#livreurs" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card title="Livraisons en cours">
            {active.length ? <DeliveryList rows={active} country={country} role="admin" /> : <EmptyState title="Aucune livraison en cours" />}
          </Card>
          <Card title="Profil">
            <CourierForm
              id={c.id}
              vehicles={VEHICLES}
              phoneExample={country.phoneExample}
              defaults={{ name: c.name, phone: c.phone ?? "", email: c.email ?? "", vehicle: c.vehicle ?? "", zone: c.zone ?? "", notes: c.notes ?? "" }}
            />
          </Card>
        </div>
        <div className="space-y-5 lg:col-span-2">
          <Card title="Compte">
            <DefinitionList
              items={[
                ["Identifiant", c.phone ?? c.email],
                ["Dernière connexion", c.last_login_at ? formatDateTime(c.last_login_at, country) : "Jamais"],
                ["Ajouté le", formatDateTime(c.created_at, country)],
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <ResetPassword userId={c.id} name={c.name} />
              <ToggleUser userId={c.id} active={!!c.active} name={c.name} />
            </div>
          </Card>
          <Card title="Activité récente">
            <Timeline events={activity} country={country} showDelivery />
          </Card>
        </div>
      </div>
    </>
  );
}

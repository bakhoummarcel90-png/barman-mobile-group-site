import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MerchantForm, ResetPassword, ToggleMerchant, ToggleUser } from "@/components/PeopleForms";
import { Timeline } from "@/components/Timeline";
import { ActiveBadge, Card, DefinitionList, PageHeader, Stat } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { merchantActivity } from "@/lib/events";
import { merchantBalances } from "@/lib/finance";
import { formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import { listMerchants, merchantAccounts } from "@/lib/people";

export const metadata: Metadata = { title: "Commerçant" };

export default async function MerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  const country = countryOf(user);
  const id = Number((await params).id);
  const m = listMerchants(user).find((x) => x.id === id);
  if (!m) notFound();
  const balance = merchantBalances(user, id)[0];
  const accounts = merchantAccounts(user, id);
  const activity = merchantActivity(user, id, 25);

  return (
    <>
      <PageHeader
        title={m.name}
        description={<ActiveBadge active={m.active} />}
        back={{ href: "/commercants", label: "Commerçants" }}
        actions={
          <Link href={`/commandes?commercant=${id}`} className="btn-secondary">
            Toutes ses commandes
          </Link>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Commandes" value={m.orders_total} />
        <Stat label="En cours" value={m.orders_active} tone="info" />
        <Stat label="À reverser" value={formatMoney(balance?.net ?? 0, country)} tone="success" href="/encaissements#commercants" />
        <Stat label="En vérification" value={formatMoney(balance?.pending_net ?? 0, country)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card title="Fiche commerçant">
            <MerchantForm
              id={m.id}
              paymentMethods={country.paymentMethods}
              neighborhoods={country.neighborhoods}
              defaults={{
                name: m.name,
                contact_name: m.contact_name ?? "",
                phone: m.phone ?? "",
                email: m.email ?? "",
                address: m.address ?? "",
                neighborhood: m.neighborhood ?? "",
                payout_method: m.payout_method ?? "",
                payout_account: m.payout_account ?? "",
                notes: m.notes ?? "",
              }}
            />
          </Card>
        </div>
        <div className="space-y-5 lg:col-span-2">
          <Card title="Accès">
            <ToggleMerchant merchantId={m.id} active={!!m.active} name={m.name} />
            <ul className="mt-4 space-y-4">
              {accounts.map((a) => (
                <li key={a.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{a.name}</p>
                    <ActiveBadge active={a.active && m.active} />
                  </div>
                  <DefinitionList
                    items={[
                      ["Identifiant", a.email ?? formatPhone(a.phone, country)],
                      ["Dernière connexion", a.last_login_at ? formatDateTime(a.last_login_at, country) : "Jamais"],
                    ]}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ResetPassword userId={a.id} name={a.name} />
                    {m.active ? <ToggleUser userId={a.id} active={!!a.active} name={a.name} /> : null}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Activité récente">
            <Timeline events={activity} country={country} showDelivery />
          </Card>
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { DeliveryList } from "@/components/DeliveryList";
import { QuickConfirm, SettleForm } from "@/components/SettleForms";
import { Alert, Card, EmptyState, OkBanner, PageHeader, PaymentBadge, Stat } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { listDeliveries } from "@/lib/deliveries";
import { parseFilters } from "@/lib/filters";
import { courierBalances, listSettlements, merchantBalances, type SettlementView } from "@/lib/finance";
import { formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import { paymentMethodLabel, type CountryConfig } from "@/lib/regions";
import type { Actor } from "@/lib/types";

export const metadata: Metadata = { title: "Encaissements" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const country = countryOf(user);
  if (user.role === "courier") return <CourierMoney user={user} country={country} />;
  if (user.role === "merchant") return <MerchantMoney user={user} country={country} />;
  const ok = (await searchParams).ok;
  return (
    <>
      <OkBanner
        code={ok}
        messages={{
          confirme: "Encaissement confirmé.",
          remise: "Remise du livreur enregistrée : voir l'historique en bas de page.",
          reversement: "Reversement au commerçant enregistré : voir l'historique en bas de page.",
        }}
      />
      <AdminMoney user={user} country={country} />
    </>
  );
}

function Rules() {
  return (
    <details className="card mb-5 p-4 text-sm text-ink-soft">
      <summary className="cursor-pointer font-semibold text-ink">Comment sont calculés les montants ?</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Le livreur saisit le montant réellement encaissé à la livraison : le paiement passe « À vérifier », ou « Écart constaté » s'il diffère du montant attendu.</li>
        <li>L'administrateur contrôle (espèces reçues, relevé Wave / Orange Money) puis confirme ou signale un écart.</li>
        <li>« À remettre » : montants encaissés par un livreur et pas encore remis à la caisse.</li>
        <li>« À reverser » : encaissements confirmés, moins les frais de livraison, pas encore versés au commerçant. Un montant négatif signifie que le commerçant doit des frais (commandes déjà payées).</li>
        <li>Wave et Orange Money ne sont pas connectés : les transferts se font en dehors de l'application, puis sont enregistrés ici.</li>
      </ul>
    </details>
  );
}

function SettlementTable({ rows, country }: { rows: SettlementView[]; country: CountryConfig }) {
  if (!rows.length) return <p className="text-sm text-ink-muted">Aucun enregistrement pour le moment.</p>;
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="table-base">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Bénéficiaire / livreur</th>
            <th className="text-right">Montant</th>
            <th>Moyen</th>
            <th>Référence</th>
            <th>Par</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td className="whitespace-nowrap">{formatDateTime(s.created_at, country)}</td>
              <td className="whitespace-nowrap">{s.kind === "courier_remittance" ? "Remise du livreur" : "Reversement commerçant"}</td>
              <td>
                {s.courier_name ?? s.merchant_name}
                <div className="text-xs text-ink-muted">{s.delivery_count} livraison(s)</div>
              </td>
              <td className="whitespace-nowrap text-right font-semibold tabular-nums">{formatMoney(s.amount, country)}</td>
              <td>{paymentMethodLabel(country, s.method)}</td>
              <td className="text-ink-muted">{s.reference ?? "—"}</td>
              <td className="text-ink-muted">{s.created_by_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Administrateur ---------- */

function AdminMoney({ user, country }: { user: Actor; country: CountryConfig }) {
  const couriers = courierBalances(user);
  const merchants = merchantBalances(user);
  const tz = country.timezone;
  const toVerify = [
    ...listDeliveries(user, parseFilters({ paiement: "ecart" }, tz), { limit: 200 }).rows,
    ...listDeliveries(user, parseFilters({ paiement: "a_verifier" }, tz), { limit: 200 }).rows,
  ].filter((d) => d.status === "livree" && !d.courier_settlement_id && !d.merchant_settlement_id);
  const settlements = listSettlements(user, { limit: 30 });
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  return (
    <>
      <PageHeader
        title="Encaissements"
        description="Vérification des montants, remises des livreurs et reversements aux commerçants"
        actions={
          <>
            <a href="/api/export/livraisons?statut=livree" className="btn-secondary btn-sm">
              <Download className="h-4 w-4" aria-hidden /> Encaissements CSV
            </a>
            <a href="/api/export/soldes" className="btn-secondary btn-sm">
              <Download className="h-4 w-4" aria-hidden /> Soldes CSV
            </a>
            <a href="/api/export/reversements" className="btn-secondary btn-sm">
              <Download className="h-4 w-4" aria-hidden /> Reversements CSV
            </a>
          </>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="À vérifier" value={toVerify.length} tone={toVerify.length ? "warning" : "success"} hint="Encaissements saisis par les livreurs" />
        <Stat label="Détenu par les livreurs" value={formatMoney(sum(couriers.map((c) => c.total)), country)} hint="À remettre à la caisse" />
        <Stat label="À reverser aux commerçants" value={formatMoney(sum(merchants.map((m) => m.net)), country)} hint="Confirmé, frais déduits" />
      </div>
      <Rules />

      <div className="space-y-5">
        <Card id="a-verifier" title={`Encaissements à vérifier (${toVerify.length})`}>
          {toVerify.length ? (
            <p className="mb-3 text-xs text-ink-muted">Pour corriger un montant ou signaler un écart, ouvrez la commande (lien du numéro).</p>
          ) : null}
          {toVerify.length ? (
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Livreur</th>
                    <th>Commerçant</th>
                    <th className="text-right">Attendu</th>
                    <th className="text-right">Collecté</th>
                    <th>Moyen</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {toVerify.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link href={`/commandes/${d.id}`} className="link whitespace-nowrap">
                          {d.reference}
                        </Link>
                        <div className="text-xs text-ink-muted">{formatDateTime(d.completed_at, country)}</div>
                      </td>
                      <td>{d.courier_name}</td>
                      <td>{d.merchant_name}</td>
                      <td className="whitespace-nowrap text-right tabular-nums">{formatMoney(d.amount_to_collect, country)}</td>
                      <td className={`whitespace-nowrap text-right font-semibold tabular-nums ${d.payment_status === "ecart" ? "text-red-700" : ""}`}>
                        {formatMoney(d.collected_amount, country)}
                      </td>
                      <td>{paymentMethodLabel(country, d.collected_payment_method)}</td>
                      <td>
                        <PaymentBadge status={d.payment_status} />
                      </td>
                      <td>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <QuickConfirm
                            id={d.id}
                            label={
                              d.payment_status === "ecart"
                                ? `Accepter ${formatMoney(d.collected_amount, country)} au lieu de ${formatMoney(d.amount_to_collect, country)} attendus ? L'écart sera noté comme accepté.`
                                : `Vous confirmez avoir reçu ou constaté ${formatMoney(d.collected_amount, country)} (${paymentMethodLabel(country, d.collected_payment_method)}).`
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert tone="success">Tous les encaissements saisis ont été vérifiés.</Alert>
          )}
        </Card>

        <Card id="livreurs" title="À remettre par les livreurs">
          {couriers.length ? (
            <ul className="space-y-4">
              {couriers.map((c) => (
                <li key={c.courier_id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/livreurs/${c.courier_id}`} className="font-semibold text-ink hover:underline">
                      {c.name}
                    </Link>
                    <span className="text-lg font-bold tabular-nums">{formatMoney(c.total, country)}</span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {c.count} livraison(s) ·{" "}
                    {Object.entries(c.byMethod)
                      .map(([m, v]) => `${paymentMethodLabel(country, m)} : ${formatMoney(v, country)}`)
                      .join(" · ")}
                  </p>
                  <div className="mt-3">
                    <SettleForm kind="courier" id={c.courier_id} who={c.name} amountLabel={formatMoney(c.total, country)} paymentMethods={country.paymentMethods} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Aucun montant détenu par les livreurs" />
          )}
        </Card>

        <Card id="commercants" title="À reverser aux commerçants">
          {merchants.length ? (
            <ul className="space-y-4">
              {merchants.map((m) => (
                <li key={m.merchant_id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/commercants/${m.merchant_id}`} className="font-semibold text-ink hover:underline">
                      {m.name}
                    </Link>
                    <span className={`text-lg font-bold tabular-nums ${m.net < 0 ? "text-red-700" : ""}`}>{formatMoney(m.net, country)}</span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {m.confirmed_count} livraison(s) confirmée(s) : {formatMoney(m.collected, country)} encaissés − {formatMoney(m.fees, country)} de frais
                    {m.pending_count ? ` · ${m.pending_count} en vérification (${formatMoney(m.pending_net, country)})` : ""}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Reversement habituel : {paymentMethodLabel(country, m.payout_method)}
                    {m.payout_account ? ` · ${formatPhone(m.payout_account, country)}` : ""}
                  </p>
                  {m.confirmed_count ? (
                    <div className="mt-3">
                      <SettleForm
                        kind="merchant"
                        id={m.merchant_id}
                        who={m.name}
                        amountLabel={formatMoney(Math.abs(m.net), country)}
                        owed={m.net < 0}
                        defaultMethod={m.payout_method}
                        paymentMethods={country.paymentMethods}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700">Confirmez d'abord les encaissements en vérification.</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Aucun montant à reverser" />
          )}
        </Card>

        <Card id="historique" title="Historique des remises et reversements">
          <SettlementTable rows={settlements} country={country} />
        </Card>
      </div>
    </>
  );
}

/* ---------- Commerçant ---------- */

function MerchantMoney({ user, country }: { user: Actor; country: CountryConfig }) {
  const balance = merchantBalances(user)[0];
  const delivered = listDeliveries(user, parseFilters({ statut: "livree", periode: "30d" }, country.timezone), { limit: 100 }).rows;
  const payouts = listSettlements(user, { limit: 30 });
  return (
    <>
      <PageHeader
        title="Mes paiements"
        description="Montants encaissés pour vous et reversements reçus"
        actions={
          <a href="/api/export/livraisons?statut=livree" className="btn-secondary btn-sm">
            <Download className="h-4 w-4" aria-hidden /> Export CSV
          </a>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Stat label="À vous reverser" value={formatMoney(balance?.net ?? 0, country)} tone="success" hint={`${balance?.confirmed_count ?? 0} livraison(s) confirmée(s), frais déduits`} />
        <Stat label="En cours de vérification" value={formatMoney(balance?.pending_net ?? 0, country)} hint={`${balance?.pending_count ?? 0} livraison(s)`} />
      </div>
      <Rules />
      <h2 className="mb-2 text-lg font-semibold text-ink">Livraisons des 30 derniers jours</h2>
      {delivered.length ? <DeliveryList rows={delivered} country={country} role="merchant" /> : <EmptyState title="Aucune livraison sur cette période" />}
      <div className="mt-5">
        <Card title="Reversements reçus">
          <SettlementTable rows={payouts} country={country} />
        </Card>
      </div>
    </>
  );
}

/* ---------- Livreur ---------- */

function CourierMoney({ user, country }: { user: Actor; country: CountryConfig }) {
  const balance = courierBalances(user)[0];
  const rows = listDeliveries(user, parseFilters({ statut: "livree" }, country.timezone), { limit: 300 }).rows.filter(
    (d) => !d.courier_settlement_id && (d.collected_amount ?? 0) > 0,
  );
  const history = listSettlements(user, { limit: 20 });
  return (
    <>
      <PageHeader title="Mon argent" description="Montants encaissés à remettre à l'entreprise" />
      <div className="card mb-5 p-5 text-center">
        <p className="text-sm text-ink-muted">À remettre à la caisse</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-ink">{formatMoney(balance?.total ?? 0, country)}</p>
        {balance ? (
          <p className="mt-1 text-sm text-ink-muted">
            {Object.entries(balance.byMethod)
              .map(([m, v]) => `${paymentMethodLabel(country, m)} : ${formatMoney(v, country)}`)
              .join(" · ")}
          </p>
        ) : null}
      </div>
      {rows.length ? <DeliveryList rows={rows} country={country} role="courier" /> : <EmptyState title="Rien à remettre pour le moment" />}
      <div className="mt-5">
        <Card title="Remises enregistrées">
          <SettlementTable rows={history} country={country} />
        </Card>
      </div>
    </>
  );
}

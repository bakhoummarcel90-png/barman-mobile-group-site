import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Store } from "lucide-react";
import { MerchantReview } from "@/components/PeopleForms";
import { ActiveBadge, EmptyState, OkBanner, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import { listMerchants } from "@/lib/people";
import { merchantsToReview } from "@/lib/signup";

export const metadata: Metadata = { title: "Commerçants" };

export default async function MerchantsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser(["admin"]);
  const country = countryOf(user);
  const merchants = listMerchants(user);
  const toReview = merchantsToReview(user);
  return (
    <>
      <PageHeader
        title="Commerçants"
        description={`${merchants.filter((m) => m.active).length} actif(s) sur ${merchants.length}`}
        actions={
          <Link href="/commercants/nouveau" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden /> Ajouter un commerçant
          </Link>
        }
      />
      <OkBanner code={(await searchParams).ok} messages={{ verifie: "Inscription vérifiée." }} />
      {toReview.length ? (
        <section id="a-verifier" className="card mb-5 scroll-mt-20 border-amber-300 p-4 sm:p-5">
          <h2 className="font-semibold text-ink">Nouveaux inscrits à vérifier ({toReview.length})</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Ces comptes sont déjà actifs. Vérifiez-les (appel, commande test) ; en cas de faux compte, ouvrez la fiche et désactivez-le.
          </p>
          <ul className="mt-3 divide-y divide-slate-100">
            {toReview.map((m) => (
              <li key={m.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/commercants/${m.id}`} className="font-semibold text-ink hover:underline">
                    {m.name}
                  </Link>
                  <span className="ml-2 text-xs text-ink-muted">{m.notes?.startsWith("Particulier") ? "Particulier" : "Commerçant"}</span>
                  <p className="text-sm text-ink-muted">
                    {m.contact_name && m.contact_name !== m.name ? `${m.contact_name} · ` : ""}
                    {m.phone ? (
                      <a href={`tel:${m.phone}`} className="link">
                        {formatPhone(m.phone, country)}
                      </a>
                    ) : null}
                    {m.email ? ` · ${m.email}` : ""}
                    {m.neighborhood ? ` · ${m.neighborhood}` : ""}
                  </p>
                  <p className="text-xs text-ink-muted">Inscrit le {formatDateTime(m.created_at, country)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MerchantReview merchantId={m.id} name={m.name} />
                  <Link href={`/commercants/${m.id}`} className="btn-secondary btn-sm">
                    Voir la fiche
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {merchants.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {merchants.map((m) => (
              <Link key={m.id} href={`/commercants/${m.id}`} className={`card block p-4 ${m.active ? "" : "opacity-70"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{m.name}</p>
                    <p className="text-sm text-ink-muted">
                      {m.contact_name} · {formatPhone(m.phone, country)}
                    </p>
                  </div>
                  <ActiveBadge active={m.active} />
                </div>
                <p className="mt-2 text-sm">
                  {m.orders_active} en cours · {m.delivered_total} livrée(s) · <strong>{formatMoney(m.to_pay, country)}</strong> à reverser
                </p>
              </Link>
            ))}
          </div>
          <div className="card hidden overflow-x-auto md:block">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Boutique</th>
                  <th>Responsable</th>
                  <th>Quartier</th>
                  <th className="text-right">En cours</th>
                  <th className="text-right">Livrées</th>
                  <th className="text-right">À reverser</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td>
                      <Link href={`/commercants/${m.id}`} className="link">
                        {m.name}
                      </Link>
                    </td>
                    <td>
                      {m.contact_name}
                      <div className="text-xs text-ink-muted">{formatPhone(m.phone, country)}</div>
                    </td>
                    <td>{m.neighborhood ?? "—"}</td>
                    <td className="text-right tabular-nums">{m.orders_active}</td>
                    <td className="text-right tabular-nums">{m.delivered_total}</td>
                    <td className="whitespace-nowrap text-right font-semibold tabular-nums">{formatMoney(m.to_pay, country)}</td>
                    <td>
                      <ActiveBadge active={m.active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState icon={Store} title="Aucun commerçant">
          Ajoutez les boutiques pour lesquelles vous livrez : elles pourront créer et suivre leurs commandes.
        </EmptyState>
      )}
    </>
  );
}

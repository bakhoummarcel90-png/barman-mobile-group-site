import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { DeliveryList } from "@/components/DeliveryList";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { listDeliveries } from "@/lib/deliveries";
import { filtersToQuery, parseFilters } from "@/lib/filters";
import { courierOptions, merchantOptions } from "@/lib/people";

export const metadata: Metadata = { title: "Commandes" };

const PAGE_SIZE = 30;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const country = countryOf(user);
  const sp = await searchParams;
  const filters = parseFilters(sp, country.timezone);
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = listDeliveries(user, filters, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isAdmin = user.role === "admin";
  const isCourier = user.role === "courier";

  return (
    <>
      <PageHeader
        title={isCourier ? "Historique de mes livraisons" : "Commandes"}
        description={`${total} commande(s) correspondant aux filtres`}
        actions={
          <>
            {!isCourier ? (
              <a href={`/api/export/livraisons${filtersToQuery(filters)}`} className="btn-secondary">
                <Download className="h-4 w-4" aria-hidden /> Export CSV
              </a>
            ) : null}
            {!isCourier ? (
              <Link href="/commandes/nouvelle" className="btn-primary">
                <Plus className="h-4 w-4" aria-hidden /> Nouvelle commande
              </Link>
            ) : null}
          </>
        }
      />
      <FilterBar
        filters={filters}
        merchants={isAdmin ? merchantOptions(user) : []}
        couriers={isAdmin ? courierOptions(user) : []}
        showPayment={!isCourier}
        basePath="/commandes"
      />
      {rows.length ? (
        <DeliveryList rows={rows} country={country} role={user.role} />
      ) : (
        <EmptyState title="Aucune commande trouvée">
          {total === 0 && filters.period === "all" && !filters.status && !filters.q && !isCourier ? (
            <>
              Créez votre première commande avec le bouton <strong>Nouvelle commande</strong>.
            </>
          ) : (
            "Modifiez ou réinitialisez les filtres pour voir d'autres commandes."
          )}
        </EmptyState>
      )}
      {pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-2 text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link className="btn-secondary btn-sm" href={`/commandes${filtersToQuery(filters, { page: String(page - 1) })}`}>
              ← Précédentes
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted">
            Page {page} / {pages}
          </span>
          {page < pages ? (
            <Link className="btn-secondary btn-sm" href={`/commandes${filtersToQuery(filters, { page: String(page + 1) })}`}>
              Suivantes →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
